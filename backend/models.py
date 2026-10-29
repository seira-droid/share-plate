import enum
from datetime import datetime
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .database import Base

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
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="both")  # seller, buyer, or both
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship("FoodListing", back_populates="seller", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="buyer")

class FoodListing(Base):
    __tablename__ = "food_listings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    seller_name = Column(String, nullable=False)
    
    food_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="Home Meals", index=True)
    quantity_available = Column(Integer, default=1)
    price = Column(Float, nullable=False, default=0.0)
    currency = Column(String, default="$")
    food_image = Column(String, nullable=True)
    
    # Status lifecycle: preparing -> ready -> reserved -> sold_out
    status = Column(String, default=ListingStatus.PREPARING.value, index=True)
    
    # Exact residential coordinates (private until reservation)
    exact_latitude = Column(Float, nullable=False, index=True)
    exact_longitude = Column(Float, nullable=False, index=True)
    
    # Approximate neighborhood coordinates (publicly visible on live map)
    approx_latitude = Column(Float, nullable=False, index=True)
    approx_longitude = Column(Float, nullable=False, index=True)
    
    pickup_address = Column(String, nullable=False)  # Exact address revealed after reservation
    approx_location_name = Column(String, nullable=False)  # Public neighborhood name
    pickup_instructions = Column(Text, nullable=True)
    dietary_tags = Column(String, nullable=True)  # e.g. "Vegetarian, Organic, Halal"
    
    ready_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller = relationship("User", back_populates="listings")
    reservations = relationship("Reservation", back_populates="listing", cascade="all, delete-orphan")

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String, ForeignKey("food_listings.id"), nullable=False, index=True)
    buyer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    buyer_name = Column(String, nullable=False)
    buyer_phone = Column(String, nullable=True)
    
    reserved_quantity = Column(Integer, default=1)
    status = Column(String, default=ReservationStatus.CONFIRMED.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("FoodListing", back_populates="reservations")
    buyer = relationship("User", back_populates="reservations")
