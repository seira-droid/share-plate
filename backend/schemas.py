from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from .models import ListingStatus, ReservationStatus

class ListingCreate(BaseModel):
    food_name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(default="Kerala Homestyle")
    quantity_available: int = Field(default=1, ge=1, le=100)
    price: float = Field(default=0.0, ge=0.0)
    currency: str = Field(default="₹")
    food_image: Optional[str] = None
    status: ListingStatus = Field(default=ListingStatus.PREPARING)
    
    # House & Portion Customization
    house_label: Optional[str] = Field(None, description="Household kitchen title or house number")
    portion_size: Optional[str] = Field(default="1 Full Meal Plate", description="Serving size, e.g. '1 Thali', '2 Porottas + Curry', '500ml container'")
    items_included: Optional[str] = Field(None, description="Specific items in 1 portion, e.g. 'Rice, Sambar, Aviyal, Thoran, Pickle'")
    spice_level: Optional[str] = Field(default="Medium", description="Mild, Medium, Spicy, Extra Spicy")
    meal_time: Optional[str] = Field(default="Lunch", description="Breakfast, Lunch, Evening Snacks, Dinner")

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
    model_config = ConfigDict(from_attributes=True)

    id: str
    seller_id: str
    seller_name: str
    food_name: str
    description: Optional[str] = None
    category: str
    quantity_available: int
    price: float
    currency: str = "₹"
    food_image: Optional[str] = None
    status: str

    # House & Portion customization
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

class ReservationCreate(BaseModel):
    quantity: int = Field(default=1, ge=1)
    buyer_phone: Optional[str] = None

class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    listing_id: str
    buyer_id: str
    buyer_name: str
    status: str
    reserved_quantity: int
    created_at: datetime
    listing: Optional[ListingDetail] = None

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
