from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..models import User
from ..schemas import UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Predefined demo profiles for easy multi-actor testing
DEMO_USERS = [
    {
        "id": "seller-priya",
        "name": "Priya Nair (House #14B - Amma's Kitchen)",
        "email": "priya.nair@foodshare.in",
        "role": "seller",
        "phone": "+91-98460-12345",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "seller-rajesh",
        "name": "Chef Rajesh Sharma (House #31 - Punjabi Rasoi)",
        "email": "rajesh.sharma@foodshare.in",
        "role": "seller",
        "phone": "+91-98100-54321",
        "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "buyer-arun",
        "name": "Arun Varghese (Foodie Neighbor)",
        "email": "arun.varghese@foodshare.in",
        "role": "buyer",
        "phone": "+91-98950-88888",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "buyer-sneha",
        "name": "Sneha Patel (Local Resident)",
        "email": "sneha.patel@foodshare.in",
        "role": "buyer",
        "phone": "+91-98200-99999",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "seller-alice",
        "name": "Alice Montgomery (Home Chef)",
        "email": "alice@foodshare.local",
        "role": "seller",
        "phone": "+91-98765-43210",
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "buyer-charlie",
        "name": "Charlie Patel (Foodie Neighbor)",
        "email": "charlie@foodshare.local",
        "role": "buyer",
        "phone": "+91-98111-22233",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    }
]

def init_demo_users(db: Session):
    for u_data in DEMO_USERS:
        existing = db.query(User).filter(User.id == u_data["id"]).first()
        if not existing:
            user = User(
                id=u_data["id"],
                name=u_data["name"],
                email=u_data["email"],
                role=u_data["role"],
                phone=u_data["phone"],
                avatar_url=u_data["avatar_url"]
            )
            db.add(user)
    db.commit()

def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to resolve authenticated user via header or query parameter.
    Defaults to Seller Alice if none provided to ensure zero friction.
    """
    uid = x_user_id or user_id or "seller-alice"
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        # Fallback to creating or returning first user
        init_demo_users(db)
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            user = db.query(User).first()
    return user

@router.get("/users", response_model=List[UserProfile])
def list_available_users(db: Session = Depends(get_db)):
    init_demo_users(db)
    users = db.query(User).all()
    return users

@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

