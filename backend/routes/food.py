from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import uuid

from ..database import get_db
from ..models import FoodListing, Reservation, User, ListingStatus, ReservationStatus
from ..schemas import (
    ListingCreate,
    ListingStatusUpdate,
    ListingPublic,
    ListingDetail,
    ReservationCreate,
    ReservationResponse
)
from ..geospatial import (
    haversine_distance_km,
    calculate_bounding_box,
    obfuscate_coordinates,
    format_distance
)
from ..websocket_manager import ws_manager
from .auth import get_current_user

router = APIRouter(prefix="/food", tags=["Food Listings & Tracking"])

def time_since_string(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    now = datetime.utcnow()
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 0:
        return "just now"
    if seconds < 60:
        return f"{seconds}s ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    return f"{days}d ago"

def to_public_listing(listing: FoodListing, buyer_lat: Optional[float] = None, buyer_lng: Optional[float] = None) -> ListingPublic:
    dist_km = None
    dist_formatted = None
    if buyer_lat is not None and buyer_lng is not None:
        dist_km = haversine_distance_km(buyer_lat, buyer_lng, listing.approx_latitude, listing.approx_longitude)
        dist_formatted = format_distance(dist_km)

    return ListingPublic(
        id=listing.id,
        seller_id=listing.seller_id,
        seller_name=listing.seller_name,
        food_name=listing.food_name,
        description=listing.description,
        category=listing.category,
        quantity_available=listing.quantity_available,
        price=listing.price,
        currency=listing.currency or "₹",
        food_image=listing.food_image,
        status=listing.status,
        house_label=listing.house_label or f"House Kitchen ({listing.seller_name})",
        portion_size=listing.portion_size or "1 Full Portion",
        items_included=listing.items_included,
        spice_level=listing.spice_level or "Medium",
        meal_time=listing.meal_time or "Lunch",
        latitude=listing.approx_latitude,  # Public privacy safe
        longitude=listing.approx_longitude,
        is_exact_location=False,
        location_name=listing.approx_location_name or "Nearby Household",
        distance_km=dist_km,
        distance_formatted=dist_formatted,
        ready_at=listing.ready_at,
        time_since_ready=time_since_string(listing.ready_at),
        dietary_tags=listing.dietary_tags,
        created_at=listing.created_at
    )

def to_detail_listing(
    listing: FoodListing,
    current_user: Optional[User] = None,
    buyer_lat: Optional[float] = None,
    buyer_lng: Optional[float] = None,
    db: Optional[Session] = None
) -> ListingDetail:
    pub = to_public_listing(listing, buyer_lat, buyer_lng)
    
    # Check if current user is seller or has an active reservation
    is_seller = current_user and (current_user.id == listing.seller_id)
    active_reservation = None
    if current_user and db:
        active_reservation = db.query(Reservation).filter(
            Reservation.listing_id == listing.id,
            Reservation.buyer_id == current_user.id,
            Reservation.status == ReservationStatus.CONFIRMED.value
        ).first()

    has_confirmed_reservation = active_reservation is not None
    can_see_exact = is_seller or has_confirmed_reservation

    # If authorized, reveal exact residential coordinates and door instructions
    lat = listing.exact_latitude if can_see_exact else listing.approx_latitude
    lng = listing.exact_longitude if can_see_exact else listing.approx_longitude
    pickup_addr = listing.pickup_address if can_see_exact else f"Revealed upon confirmed reservation (~{listing.approx_location_name})"
    instructions = listing.pickup_instructions if can_see_exact else "Detailed instructions will be unlocked upon reservation."

    return ListingDetail(
        **pub.model_dump(exclude={"latitude", "longitude", "is_exact_location"}),
        latitude=lat,
        longitude=lng,
        is_exact_location=can_see_exact,
        pickup_address=pickup_addr,
        pickup_instructions=instructions,
        reserved_by_current_user=has_confirmed_reservation,
        active_reservation_id=active_reservation.id if active_reservation else None
    )

# -------------------------------------------------------------
# 1. GET /food/nearby
# Retrieve available food listings within specified geographical radius
# -------------------------------------------------------------
@router.get("/nearby", response_model=List[ListingPublic])
def get_nearby_food(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Buyer latitude"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Buyer longitude"),
    radius_km: float = Query(5.0, gt=0, le=50.0, description="Search radius in kilometers"),
    category: Optional[str] = Query(None, description="Optional food category filter"),
    status: Optional[str] = Query(None, description="Status filter: ready, preparing, all"),
    search: Optional[str] = Query(None, description="Search query string"),
    db: Session = Depends(get_db)
):
    min_lat, max_lat, min_lon, max_lon = calculate_bounding_box(lat, lng, radius_km)

    # Initial database query with bounding box coarse filter
    query = db.query(FoodListing).filter(
        FoodListing.approx_latitude.between(min_lat, max_lat),
        FoodListing.approx_longitude.between(min_lon, max_lon)
    )

    # Status filtering: By default, buyers discover READY (and optionally PREPARING)
    if status and status != "all":
        query = query.filter(FoodListing.status == status)
    elif not status:
        # Default: show active opportunities (READY and PREPARING)
        query = query.filter(FoodListing.status.in_([ListingStatus.READY.value, ListingStatus.PREPARING.value]))

    if category and category != "All":
        query = query.filter(FoodListing.category == category)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (FoodListing.food_name.ilike(search_filter)) |
            (FoodListing.description.ilike(search_filter)) |
            (FoodListing.seller_name.ilike(search_filter))
        )

    candidates = query.all()

    # Exact Haversine distance filtering and sorting nearest first
    nearby_items = []
    for item in candidates:
        distance = haversine_distance_km(lat, lng, item.approx_latitude, item.approx_longitude)
        if distance <= radius_km:
            pub_listing = to_public_listing(item, lat, lng)
            nearby_items.append((distance, pub_listing))

    # Sort ascending by distance (nearest available food locations first)
    nearby_items.sort(key=lambda x: x[0])
    return [item[1] for item in nearby_items]

# -------------------------------------------------------------
# 2. POST /food/listings
# Create a new food listing with location information
# -------------------------------------------------------------
@router.post("/listings", response_model=ListingDetail, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing_id = str(uuid.uuid4())
    
    # Generate privacy-safe approximate coordinates
    approx_lat, approx_lon = obfuscate_coordinates(payload.latitude, payload.longitude, listing_id)
    
    # Default neighborhood name if not provided
    approx_location = payload.approx_location_name or "Local Neighborhood"

    is_ready = payload.status == ListingStatus.READY
    ready_time = datetime.utcnow() if is_ready else None

    listing = FoodListing(
        id=listing_id,
        seller_id=current_user.id,
        seller_name=current_user.name,
        food_name=payload.food_name,
        description=payload.description,
        category=payload.category,
        quantity_available=payload.quantity_available,
        price=payload.price,
        currency=payload.currency or "₹",
        food_image=payload.food_image,
        status=payload.status.value,
        house_label=payload.house_label or f"Kitchen of {current_user.name}",
        portion_size=payload.portion_size or "1 Full Meal Plate",
        items_included=payload.items_included,
        spice_level=payload.spice_level or "Medium",
        meal_time=payload.meal_time or "Lunch",
        exact_latitude=payload.latitude,
        exact_longitude=payload.longitude,
        approx_latitude=approx_lat,
        approx_longitude=approx_lon,
        pickup_address=payload.pickup_address,
        approx_location_name=approx_location,
        pickup_instructions=payload.pickup_instructions,
        dietary_tags=payload.dietary_tags,
        ready_at=ready_time,
        created_at=datetime.utcnow()
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Real-time event propagation
    public_data = to_public_listing(listing).model_dump()
    await ws_manager.broadcast_listing_event(
        event_type="listing_created",
        listing_data=public_data,
        listing_lat=listing.approx_latitude,
        listing_lon=listing.approx_longitude
    )

    return to_detail_listing(listing, current_user=current_user, db=db)

# -------------------------------------------------------------
# 3. PATCH /food/listings/{id}/status
# Update food availability status (Preparing -> Ready -> Reserved -> Sold Out)
# -------------------------------------------------------------
@router.patch("/listings/{listing_id}/status", response_model=ListingDetail)
async def update_listing_status(
    listing_id: str,
    payload: ListingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Food listing not found")

    # Authorize seller
    if listing.seller_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this listing")

    old_status = listing.status
    new_status = payload.status.value
    listing.status = new_status
    listing.updated_at = datetime.utcnow()

    # If marked as READY, record ready timestamp
    if new_status == ListingStatus.READY.value and old_status != ListingStatus.READY.value:
        listing.ready_at = datetime.utcnow()

    db.commit()
    db.refresh(listing)

    # Broadcast real-time status change to all nearby buyers
    public_data = to_public_listing(listing).model_dump()
    await ws_manager.broadcast_listing_event(
        event_type="listing_status_changed",
        listing_data=public_data,
        listing_lat=listing.approx_latitude,
        listing_lon=listing.approx_longitude
    )

    return to_detail_listing(listing, current_user=current_user, db=db)

# -------------------------------------------------------------
# 4. GET /food/listings/{id}
# Retrieve complete listing information
# -------------------------------------------------------------
@router.get("/listings/{listing_id}", response_model=ListingDetail)
def get_listing_detail(
    listing_id: str,
    buyer_lat: Optional[float] = None,
    buyer_lng: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Food listing not found")

    return to_detail_listing(
        listing,
        current_user=current_user,
        buyer_lat=buyer_lat,
        buyer_lng=buyer_lng,
        db=db
    )

# -------------------------------------------------------------
# 5. POST /food/listings/{id}/reserve
# Allow a buyer to reserve available food (atomic transaction with race condition check)
# -------------------------------------------------------------
@router.post("/listings/{listing_id}/reserve", response_model=ReservationResponse)
async def reserve_food(
    listing_id: str,
    payload: ReservationCreate = ReservationCreate(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Lock and verify listing availability
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).with_for_update().first()
    if not listing:
        raise HTTPException(status_code=404, detail="Food listing not found")

    if listing.status not in [ListingStatus.READY.value, ListingStatus.PREPARING.value]:
        raise HTTPException(status_code=400, detail=f"Listing is not available for reservation (Status: {listing.status})")

    if listing.quantity_available < payload.quantity:
        raise HTTPException(status_code=400, detail=f"Only {listing.quantity_available} portions remaining")

    # Seller cannot reserve their own listing
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Sellers cannot reserve their own food listings")

    # Create reservation
    reservation = Reservation(
        id=str(uuid.uuid4()),
        listing_id=listing.id,
        buyer_id=current_user.id,
        buyer_name=current_user.name,
        buyer_phone=payload.buyer_phone or current_user.phone,
        reserved_quantity=payload.quantity,
        status=ReservationStatus.CONFIRMED.value,
        created_at=datetime.utcnow()
    )

    listing.quantity_available -= payload.quantity
    if listing.quantity_available <= 0:
        listing.status = ListingStatus.RESERVED.value

    listing.updated_at = datetime.utcnow()
    db.add(reservation)
    db.commit()
    db.refresh(listing)
    db.refresh(reservation)

    # Real-time event propagation
    public_data = to_public_listing(listing).model_dump()
    await ws_manager.broadcast_listing_event(
        event_type="listing_reserved",
        listing_data=public_data,
        listing_lat=listing.approx_latitude,
        listing_lon=listing.approx_longitude
    )

    detail = to_detail_listing(listing, current_user=current_user, db=db)
    return ReservationResponse(
        id=reservation.id,
        listing_id=reservation.listing_id,
        buyer_id=reservation.buyer_id,
        buyer_name=reservation.buyer_name,
        status=reservation.status,
        reserved_quantity=reservation.reserved_quantity,
        created_at=reservation.created_at,
        listing=detail
    )

# -------------------------------------------------------------
# 6. POST /food/listings/{id}/cancel
# Cancel a reservation where permitted
# -------------------------------------------------------------
@router.post("/listings/{listing_id}/cancel", response_model=ListingDetail)
async def cancel_reservation(
    listing_id: str,
    reservation_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Food listing not found")

    # Find the reservation
    res_query = db.query(Reservation).filter(
        Reservation.listing_id == listing_id,
        Reservation.status == ReservationStatus.CONFIRMED.value
    )
    if reservation_id:
        res_query = res_query.filter(Reservation.id == reservation_id)
    else:
        # Default to current user's reservation
        res_query = res_query.filter(Reservation.buyer_id == current_user.id)

    reservation = res_query.first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Active reservation not found")

    # Authorization: Either buyer or seller can cancel
    if reservation.buyer_id != current_user.id and listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this reservation")

    reservation.status = ReservationStatus.CANCELLED.value
    listing.quantity_available += reservation.reserved_quantity
    
    # Restore status to READY if previously marked RESERVED
    if listing.status == ListingStatus.RESERVED.value:
        listing.status = ListingStatus.READY.value

    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    # Real-time event propagation
    public_data = to_public_listing(listing).model_dump()
    await ws_manager.broadcast_listing_event(
        event_type="listing_cancelled",
        listing_data=public_data,
        listing_lat=listing.approx_latitude,
        listing_lon=listing.approx_longitude
    )

    return to_detail_listing(listing, current_user=current_user, db=db)

# -------------------------------------------------------------
# Seller Dashboard: My Listings
# -------------------------------------------------------------
@router.get("/my-listings", response_model=List[ListingDetail])
def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listings = db.query(FoodListing).filter(FoodListing.seller_id == current_user.id).order_by(FoodListing.created_at.desc()).all()
    return [to_detail_listing(item, current_user=current_user, db=db) for item in listings]

# -------------------------------------------------------------
# Buyer Dashboard: My Active Reservations
# -------------------------------------------------------------
@router.get("/my-reservations", response_model=List[ReservationResponse])
def get_my_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservations = db.query(Reservation).filter(
        Reservation.buyer_id == current_user.id,
        Reservation.status == ReservationStatus.CONFIRMED.value
    ).order_by(Reservation.created_at.desc()).all()

    result = []
    for r in reservations:
        listing = db.query(FoodListing).filter(FoodListing.id == r.listing_id).first()
        listing_detail = to_detail_listing(listing, current_user=current_user, db=db) if listing else None
        result.append(ReservationResponse(
            id=r.id,
            listing_id=r.listing_id,
            buyer_id=r.buyer_id,
            buyer_name=r.buyer_name,
            status=r.status,
            reserved_quantity=r.reserved_quantity,
            created_at=r.created_at,
            listing=listing_detail
        ))
    return result

# -------------------------------------------------------------
# Seed Data Helper
# -------------------------------------------------------------
@router.post("/seed")
def seed_nearby_data(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    db: Session = Depends(get_db)
):
    from ..seed_data import seed_sample_listings
    seed_sample_listings(db, lat, lng)
    return {"status": "success", "message": f"Sample listings seeded around ({lat}, {lng})"}

