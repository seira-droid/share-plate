from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from .models import UserRole, ListingStatus, ReservationStatus, AccountStatus

# -------------------------------------------------------------
# Authentication Schemas
# -------------------------------------------------------------
class BuyerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=120)
    phone: str = Field(..., min_length=8, max_length=20)
    password: str = Field(..., min_length=6, max_length=120)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SellerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=120)
    phone: str = Field(..., min_length=8, max_length=20)
    password: str = Field(..., min_length=6, max_length=120)
    kitchen_name: str = Field(..., min_length=2, max_length=120)
    pickup_location: str = Field(..., min_length=3, max_length=250)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

class LoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str
    role: str
    account_status: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    kitchen_name: Optional[str] = None
    pickup_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# -------------------------------------------------------------
# Food Listing Schemas
# -------------------------------------------------------------
class ListingCreate(BaseModel):
    food_name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(default="Kerala Homestyle")
    quantity: int = Field(default=5, ge=1, le=100)
    quantity_available: Optional[int] = None
    price: float = Field(..., ge=0.0)
    currency: str = Field(default="₹")
    image_url: Optional[str] = None
    food_image: Optional[str] = None  # alias
    status: Optional[str] = ListingStatus.PREPARING.value
    
    # Household & Portion Customization
    house_label: Optional[str] = Field(None, description="House identifier or kitchen name")
    portion_size: Optional[str] = Field(default="1 Full Meal Plate")
    items_included: Optional[str] = Field(None)
    spice_level: Optional[str] = Field(default="Medium")
    meal_time: Optional[str] = Field(default="Lunch")

    # Seller GPS Location
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    pickup_address: str = Field(..., min_length=3, max_length=250)
    approx_location_name: Optional[str] = None
    pickup_instructions: Optional[str] = None
    dietary_tags: Optional[str] = None

class ListingStatusUpdate(BaseModel):
    status: str

class ListingPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    seller_id: str
    seller_name: str
    food_name: str
    description: Optional[str] = None
    category: str
    quantity: int
    quantity_available: int
    price: float
    currency: str = "₹"
    image_url: Optional[str] = None
    food_image: Optional[str] = None
    status: str
    availability_status: str

    house_label: Optional[str] = None
    portion_size: Optional[str] = None
    items_included: Optional[str] = None
    spice_level: Optional[str] = None
    meal_time: Optional[str] = None
    
    # Coordinates (Approximate for public privacy)
    latitude: float
    longitude: float
    is_exact_location: bool = False
    location_name: str
    
    distance_km: Optional[float] = None
    distance_formatted: Optional[str] = None
    ready_at: Optional[datetime] = None
    time_since_ready: Optional[str] = None
    dietary_tags: Optional[str] = None
    created_at: datetime

class ListingDetail(ListingPublic):
    pickup_address: Optional[str] = None
    pickup_instructions: Optional[str] = None
    reserved_by_current_user: bool = False
    active_reservation_id: Optional[str] = None

# -------------------------------------------------------------
# Reservation Schemas
# -------------------------------------------------------------
class ReservationCreate(BaseModel):
    quantity: int = Field(default=1, ge=1)
    buyer_phone: Optional[str] = None

class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    food_listing_id: str
    listing_id: Optional[str] = None  # alias
    buyer_id: str
    buyer_name: str
    quantity: int
    reserved_quantity: Optional[int] = None
    reservation_status: str
    status: Optional[str] = None
    created_at: datetime
    listing: Optional[ListingDetail] = None

# -------------------------------------------------------------
# Admin & Moderation Schemas
# -------------------------------------------------------------
class AdminOverviewStats(BaseModel):
    total_users: int
    active_buyers: int
    active_sellers: int
    available_listings: int
    ready_for_pickup: int
    active_reservations: int
    completed_transactions: int
    reported_listings_count: int
    total_gmv_rupees: float

class SellerVerificationUpdate(BaseModel):
    verification_status: str  # approved, suspended, pending
    account_status: Optional[str] = None  # active, suspended

class ReportCreate(BaseModel):
    reported_listing_id: Optional[str] = None
    reported_user_id: Optional[str] = None
    reason: str

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reporter_id: str
    reported_listing_id: Optional[str] = None
    reported_user_id: Optional[str] = None
    reason: str
    status: str
    created_at: datetime
