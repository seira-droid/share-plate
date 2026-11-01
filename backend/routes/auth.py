import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, SellerProfile, UserRole, AccountStatus
from ..schemas import (
    BuyerRegisterRequest,
    SellerRegisterRequest,
    LoginRequest,
    AdminLoginRequest,
    AuthResponse,
    UserProfile
)
from ..auth_security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

# -------------------------------------------------------------
# Seed Realistic Indian Sample Identities
# -------------------------------------------------------------
SAMPLE_BUYERS = [
    {"id": "buyer-ananya", "name": "Ananya Menon", "email": "ananya.menon@foodnearby.in", "phone": "+91-98460-11223"},
    {"id": "buyer-arjun", "name": "Arjun Nair", "email": "arjun.nair@foodnearby.in", "phone": "+91-98461-22334"},
    {"id": "buyer-priya", "name": "Priya Sharma", "email": "priya.sharma@foodnearby.in", "phone": "+91-98462-33445"},
    {"id": "buyer-rahul", "name": "Rahul Varma", "email": "rahul.varma@foodnearby.in", "phone": "+91-98463-44556"},
    {"id": "buyer-meera", "name": "Meera Krishnan", "email": "meera.krishnan@foodnearby.in", "phone": "+91-98464-55667"},
    {"id": "buyer-sneha", "name": "Sneha Patel", "email": "sneha.patel@foodnearby.in", "phone": "+91-98200-99999"}
]

SAMPLE_SELLERS = [
    {
        "id": "seller-lakshmi",
        "name": "Lakshmi Menon",
        "email": "lakshmi.menon@foodnearby.in",
        "phone": "+91-98470-10101",
        "kitchen": "House #12B (Lakshmi's Traditional Kitchen)",
        "address": "12B, Panampilly Nagar Main Road, Kochi",
        "lat": 9.9625,
        "lon": 76.2990
    },
    {
        "id": "seller-suresh",
        "name": "Suresh Babu",
        "email": "suresh.babu@foodnearby.in",
        "phone": "+91-98471-20202",
        "kitchen": "Flat 304 (Suresh's Spice Kitchen)",
        "address": "Flat 304, Palm Grove Apartments, Ravipuram, Kochi",
        "lat": 9.9580,
        "lon": 76.2950
    },
    {
        "id": "seller-divya",
        "name": "Divya Nair",
        "email": "divya.nair@foodnearby.in",
        "phone": "+91-98472-30303",
        "kitchen": "House #7A (Divya's Appam Corner)",
        "address": "7A, Girinagar Colony, Kadavanthra, Kochi",
        "lat": 9.9680,
        "lon": 76.3020
    },
    {
        "id": "seller-kavitha",
        "name": "Kavitha Raj",
        "email": "kavitha.raj@foodnearby.in",
        "phone": "+91-98473-40404",
        "kitchen": "Villa 18 (Kavitha's Tiffin Hut)",
        "address": "Villa 18, Marine Drive Skywalk, Kochi",
        "lat": 9.9790,
        "lon": 76.2780
    },
    {
        "id": "seller-anil",
        "name": "Anil Kumar",
        "email": "anil.kumar@foodnearby.in",
        "phone": "+91-98474-50505",
        "kitchen": "House #44 (Anil's South Indian Hearth)",
        "address": "44, South Railway Station Road, Kochi",
        "lat": 9.9650,
        "lon": 76.2890
    }
]

SAMPLE_ADMIN = {
    "id": "admin-root",
    "name": "Admin",
    "email": "admin@foodnearby.in",
    "phone": "+91-98000-00001",
    "password": "Admin@FoodNearby2026"
}

def init_demo_identities(db: Session):
    """Seed initial sample users (Buyers, Sellers, Admin) if not already present."""
    default_pw_hash = hash_password("Demo@Password123")
    
    # 1. Admin account
    admin_user = db.query(User).filter(User.email == SAMPLE_ADMIN["email"]).first()
    if not admin_user:
        admin_user = User(
            id=SAMPLE_ADMIN["id"],
            full_name=SAMPLE_ADMIN["name"],
            email=SAMPLE_ADMIN["email"],
            phone=SAMPLE_ADMIN["phone"],
            password_hash=hash_password(SAMPLE_ADMIN["password"]),
            role=UserRole.ADMIN.value,
            account_status=AccountStatus.ACTIVE.value
        )
        db.add(admin_user)

    # 2. Sample Buyers
    for b in SAMPLE_BUYERS:
        existing = db.query(User).filter(User.id == b["id"]).first()
        if not existing:
            user = User(
                id=b["id"],
                full_name=b["name"],
                email=b["email"],
                phone=b["phone"],
                password_hash=default_pw_hash,
                role=UserRole.BUYER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            db.add(user)

    # 3. Sample Sellers
    for s in SAMPLE_SELLERS:
        existing = db.query(User).filter(User.id == s["id"]).first()
        if not existing:
            user = User(
                id=s["id"],
                full_name=s["name"],
                email=s["email"],
                phone=s["phone"],
                password_hash=default_pw_hash,
                role=UserRole.SELLER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            db.add(user)
            db.flush()
            
            profile = SellerProfile(
                user_id=user.id,
                kitchen_name=s["kitchen"],
                pickup_location=s["address"],
                latitude=s["lat"],
                longitude=s["lon"],
                verification_status="approved"
            )
            db.add(profile)

    # 4. Legacy compatibility users
    for leg_id, leg_name, leg_role in [("seller-alice", "Alice Montgomery", "SELLER"), ("buyer-charlie", "Charlie Patel", "BUYER")]:
        if not db.query(User).filter(User.id == leg_id).first():
            db.add(User(
                id=leg_id,
                full_name=leg_name,
                email=f"{leg_id}@foodshare.local",
                password_hash=default_pw_hash,
                role=leg_role,
                account_status=AccountStatus.ACTIVE.value
            ))

    db.commit()

# Alias for backwards compatibility
init_demo_users = init_demo_identities

def user_to_profile(user: User) -> UserProfile:
    kitchen = user.seller_profile.kitchen_name if user.seller_profile else None
    pickup = user.seller_profile.pickup_location if user.seller_profile else None
    lat = user.seller_profile.latitude if user.seller_profile else None
    lon = user.seller_profile.longitude if user.seller_profile else None

    return UserProfile(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        account_status=user.account_status,
        avatar_url=user.avatar_url,
        kitchen_name=kitchen,
        pickup_location=pickup,
        latitude=lat,
        longitude=lon,
        created_at=user.created_at
    )

# -------------------------------------------------------------
# A. Buyer Registration
# -------------------------------------------------------------
@router.post("/register/buyer", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_buyer(payload: BuyerRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    user = User(
        id=str(uuid.uuid4()),
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone.strip(),
        password_hash=hash_password(payload.password),
        role=UserRole.BUYER.value,
        account_status=AccountStatus.ACTIVE.value
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    return AuthResponse(access_token=token, user=user_to_profile(user))

# -------------------------------------------------------------
# B. Seller Registration
# -------------------------------------------------------------
@router.post("/register/seller", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_seller(payload: SellerRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    user = User(
        id=str(uuid.uuid4()),
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        phone=payload.phone.strip(),
        password_hash=hash_password(payload.password),
        role=UserRole.SELLER.value,
        account_status=AccountStatus.ACTIVE.value
    )
    db.add(user)
    db.flush()

    profile = SellerProfile(
        user_id=user.id,
        kitchen_name=payload.kitchen_name.strip(),
        pickup_location=payload.pickup_location.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        verification_status="approved"
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    return AuthResponse(access_token=token, user=user_to_profile(user))

# -------------------------------------------------------------
# Standard Login (Buyer / Seller)
# -------------------------------------------------------------
@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.account_status == AccountStatus.SUSPENDED.value:
        raise HTTPException(status_code=403, detail="Account suspended. Please contact administrator.")

    token = create_access_token(user)
    return AuthResponse(access_token=token, user=user_to_profile(user))

# -------------------------------------------------------------
# C. Dedicated Admin Login (Separate Endpoint)
# -------------------------------------------------------------
@router.post("/admin-login", response_model=AuthResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid administrator credentials.")

    # Strict Admin verification on server:
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: This portal is exclusively for authorized administrators."
        )

    token = create_access_token(user)
    return AuthResponse(access_token=token, user=user_to_profile(user))

# -------------------------------------------------------------
# Demo 1-Click Login for Fast Multi-Role Switching
# -------------------------------------------------------------
@router.post("/demo-login/{user_id}", response_model=AuthResponse)
def demo_login(user_id: str, db: Session = Depends(get_db)):
    init_demo_identities(db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo persona not found")

    token = create_access_token(user)
    return AuthResponse(access_token=token, user=user_to_profile(user))

# -------------------------------------------------------------
# Current User Profile
# -------------------------------------------------------------
@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_profile(current_user)

# -------------------------------------------------------------
# List Available Demo Personas for Evaluation
# -------------------------------------------------------------
@router.get("/users", response_model=List[UserProfile])
def list_demo_users(db: Session = Depends(get_db)):
    init_demo_identities(db)
    users = db.query(User).all()
    return [user_to_profile(u) for u in users]
