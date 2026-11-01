from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, SellerProfile, FoodListing, Reservation, Report, UserRole, AccountStatus, ListingStatus, ReservationStatus
from ..schemas import (
    AdminOverviewStats,
    UserProfile,
    SellerVerificationUpdate,
    ListingDetail,
    ReservationResponse,
    ReportCreate,
    ReportResponse
)
from ..auth_security import require_admin, get_current_user
from ..websocket_manager import ws_manager
from .auth import user_to_profile

router = APIRouter(prefix="/admin", tags=["Administrator Management & Analytics"])

# -------------------------------------------------------------
# 1. Platform-Wide Analytics Overview
# -------------------------------------------------------------
@router.get("/overview", response_model=AdminOverviewStats)
def get_admin_overview(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_buyers = db.query(User).filter(User.role == UserRole.BUYER.value).count()
    active_sellers = db.query(User).filter(User.role == UserRole.SELLER.value).count()

    available_listings = db.query(FoodListing).filter(
        FoodListing.availability_status.in_([ListingStatus.READY.value, ListingStatus.PREPARING.value])
    ).count()

    ready_count = db.query(FoodListing).filter(FoodListing.availability_status == ListingStatus.READY.value).count()
    active_reservations = db.query(Reservation).filter(Reservation.reservation_status == ReservationStatus.CONFIRMED.value).count()
    completed_tx = db.query(Reservation).filter(Reservation.reservation_status == ReservationStatus.COMPLETED.value).count()
    reports_count = db.query(Report).filter(Report.status == "pending").count()

    # Calculate total gross marketplace volume (GMV)
    gmv_val = db.query(func.sum(FoodListing.price * Reservation.quantity))\
        .join(Reservation, Reservation.food_listing_id == FoodListing.id)\
        .filter(Reservation.reservation_status.in_([ReservationStatus.CONFIRMED.value, ReservationStatus.COMPLETED.value]))\
        .scalar() or 0.0

    return AdminOverviewStats(
        total_users=total_users,
        active_buyers=active_buyers,
        active_sellers=active_sellers,
        available_listings=available_listings,
        ready_for_pickup=ready_count,
        active_reservations=active_reservations,
        completed_transactions=completed_tx,
        reported_listings_count=reports_count,
        total_gmv_rupees=float(gmv_val)
    )

# -------------------------------------------------------------
# 2. View Registered Buyers & Sellers
# -------------------------------------------------------------
@router.get("/users", response_model=List[UserProfile])
def list_users(
    role: Optional[str] = Query(None, description="BUYER or SELLER filter"),
    status: Optional[str] = Query(None, description="active or suspended"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    if status:
        query = query.filter(User.account_status == status)

    users = query.order_by(User.created_at.desc()).all()
    return [user_to_profile(u) for u in users]

# -------------------------------------------------------------
# 3. Approve or Suspend Seller Accounts
# -------------------------------------------------------------
@router.patch("/sellers/{seller_id}/verify", response_model=UserProfile)
def update_seller_verification(
    seller_id: str,
    payload: SellerVerificationUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    seller = db.query(User).filter(User.id == seller_id, User.role == UserRole.SELLER.value).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller account not found")

    if seller.seller_profile:
        seller.seller_profile.verification_status = payload.verification_status

    if payload.account_status:
        seller.account_status = payload.account_status
    elif payload.verification_status == "suspended":
        seller.account_status = AccountStatus.SUSPENDED.value
    elif payload.verification_status == "approved":
        seller.account_status = AccountStatus.ACTIVE.value

    db.commit()
    db.refresh(seller)
    return user_to_profile(seller)

# -------------------------------------------------------------
# 4. Monitor All Food Listings Across Platform
# -------------------------------------------------------------
@router.get("/listings", response_model=List[dict])
def list_all_listings(
    status: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FoodListing)
    if status:
        query = query.filter(FoodListing.availability_status == status)
    
    listings = query.order_by(FoodListing.created_at.desc()).all()
    results = []
    for l in listings:
        results.append({
            "id": l.id,
            "seller_id": l.seller_id,
            "seller_name": l.seller_name,
            "food_name": l.food_name,
            "category": l.category,
            "price": l.price,
            "currency": l.currency,
            "quantity": l.quantity,
            "quantity_available": l.quantity_available,
            "status": l.availability_status,
            "house_label": l.house_label,
            "portion_size": l.portion_size,
            "pickup_address": l.pickup_address,
            "approx_location_name": l.approx_location_name,
            "ready_at": l.ready_at,
            "created_at": l.created_at,
            "image_url": l.image_url
        })
    return results

# -------------------------------------------------------------
# 5. Remove Inappropriate Listing
# -------------------------------------------------------------
@router.delete("/listings/{listing_id}")
async def remove_listing(
    listing_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    lat, lon = listing.approx_latitude, listing.approx_longitude
    deleted_data = {"id": listing.id, "food_name": listing.food_name, "status": "removed"}
    db.delete(listing)
    db.commit()

    # Real-time event propagation so buyers' maps remove marker immediately
    await ws_manager.broadcast_listing_event(
        event_type="listing_deleted",
        listing_data=deleted_data,
        listing_lat=lat,
        listing_lon=lon
    )

    return {"status": "success", "message": f"Listing '{deleted_data['food_name']}' removed by administrator"}

# -------------------------------------------------------------
# 6. Monitor All Platform Reservations
# -------------------------------------------------------------
@router.get("/reservations", response_model=List[dict])
def list_all_reservations(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    reservations = db.query(Reservation).order_by(Reservation.created_at.desc()).all()
    results = []
    for r in reservations:
        listing = db.query(FoodListing).filter(FoodListing.id == r.food_listing_id).first()
        results.append({
            "id": r.id,
            "listing_id": r.food_listing_id,
            "food_name": listing.food_name if listing else "Removed Dish",
            "seller_name": listing.seller_name if listing else "Unknown",
            "buyer_id": r.buyer_id,
            "buyer_name": r.buyer_name,
            "buyer_phone": r.buyer_phone,
            "quantity": r.quantity,
            "total_price": (listing.price * r.quantity) if listing else 0.0,
            "status": r.reservation_status,
            "created_at": r.created_at
        })
    return results

# -------------------------------------------------------------
# 7. Content Moderation & Reports
# -------------------------------------------------------------
@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def submit_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = Report(
        id=str(datetime.utcnow().timestamp()),
        reporter_id=current_user.id,
        reported_listing_id=payload.reported_listing_id,
        reported_user_id=payload.reported_user_id,
        reason=payload.reason,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return reports

