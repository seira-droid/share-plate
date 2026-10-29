from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from .models import ListingStatus, ReservationStatus

class ListingCreate(BaseModel):
    food_name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(default="Home Meals")
    quantity_available: int = Field(default=1, ge=1, le=50)
    price: float = Field(default=0.0, ge=0.0)
    currency: str = Field(default="$")
    food_image: Optional[str] = None
    status: ListingStatus = Field(default=ListingStatus.PREPARING)
    
    # Seller's captured GPS location
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    
    # Residential address & neighborhood
    pickup_address: str = Field(..., min_length=3, max_length=250)
    approx_location_name: Optional[str] = None
    pickup_instructions: Optional[str] = None
    dietary_tags: Optional[str] = None

class ListingStatusUpdate(BaseModel):
    status: ListingStatus

class ListingPublic(BaseModel):
    id: str
    seller_id: str
    seller_name: str
    food_name: str
    description: Optional[str] = None
    category: str
    quantity_available: int
    price: float
    currency: str
    food_image: Optional[str] = None
    status: str
    
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

    class Config:
        from_attributes = True

class ListingDetail(ListingPublic):
    pickup_address: Optional[str] = None
    pickup_instructions: Optional[str] = None
    reserved_by_current_user: bool = False
    active_reservation_id: Optional[str] = None

class ReservationCreate(BaseModel):
    quantity: int = Field(default=1, ge=1)
    buyer_phone: Optional[str] = None

class ReservationResponse(BaseModel):
    id: str
    listing_id: str
    buyer_id: str
    buyer_name: str
    status: str
    reserved_quantity: int
    created_at: datetime
    listing: Optional[ListingDetail] = None

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
