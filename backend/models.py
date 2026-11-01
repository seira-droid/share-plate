import enum
from datetime import datetime
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    BUYER = "BUYER"
    SELLER = "SELLER"
    ADMIN = "ADMIN"

class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING_APPROVAL = "pending_approval"

class ListingStatus(str, enum.Enum):
    PREPARING = "preparing"
    READY = "ready"
    RESERVED = "reserved"
    SOLD_OUT = "sold_out"

class ReservationStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default=UserRole.BUYER.value, index=True)
    account_status = Column(String, nullable=False, default=AccountStatus.ACTIVE.value, index=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    seller_profile = relationship("SellerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    listings = relationship("FoodListing", back_populates="seller", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="buyer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class SellerProfile(Base):
    __tablename__ = "seller_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    kitchen_name = Column(String, nullable=False)
    pickup_location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    verification_status = Column(String, default="approved")  # approved, pending, suspended
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="seller_profile")

class FoodListing(Base):
    __tablename__ = "food_listings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    seller_name = Column(String, nullable=False)
    
    food_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="Kerala Homestyle", index=True)
    quantity = Column(Integer, default=1)
    quantity_available = Column(Integer, default=1)
    price = Column(Float, nullable=False, default=0.0)
    currency = Column(String, default="₹")
    image_url = Column(String, nullable=True)
    
    # Status: preparing, ready, reserved, sold_out
    availability_status = Column(String, default=ListingStatus.PREPARING.value, index=True)

    # Household & Portion Customization
    house_label = Column(String, nullable=True)
    portion_size = Column(String, default="1 Full Portion")
    items_included = Column(Text, nullable=True)
    spice_level = Column(String, default="Medium")
    meal_time = Column(String, default="Lunch")
    
    # Exact residential coordinates (private until reservation)
    exact_latitude = Column(Float, nullable=False, index=True)
    exact_longitude = Column(Float, nullable=False, index=True)
    
    # Approximate neighborhood coordinates (publicly visible on live 3D map)
    approx_latitude = Column(Float, nullable=False, index=True)
    approx_longitude = Column(Float, nullable=False, index=True)
    
    pickup_address = Column(String, nullable=False)
    approx_location_name = Column(String, nullable=False)
    pickup_instructions = Column(Text, nullable=True)
    dietary_tags = Column(String, nullable=True)
    
    ready_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller = relationship("User", back_populates="listings")
    reservations = relationship("Reservation", back_populates="listing", cascade="all, delete-orphan")

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    food_listing_id = Column(String, ForeignKey("food_listings.id"), nullable=False, index=True)
    buyer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    buyer_name = Column(String, nullable=False)
    buyer_phone = Column(String, nullable=True)
    
    quantity = Column(Integer, default=1)
    reservation_status = Column(String, default=ReservationStatus.CONFIRMED.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("FoodListing", back_populates="reservations")
    buyer = relationship("User", back_populates="reservations")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    reported_listing_id = Column(String, ForeignKey("food_listings.id"), nullable=True)
    reported_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
