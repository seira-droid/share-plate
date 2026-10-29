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
        "id": "seller-alice",
        "name": "Alice Montgomery (Home Chef)",
        "email": "alice@foodshare.local",
        "role": "seller",
        "phone": "+1-555-0192",
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "seller-bob",
        "name": "Bob Rodriguez (Artisan Baker)",
        "email": "bob@foodshare.local",
        "role": "seller",
        "phone": "+1-555-0143",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "buyer-charlie",
        "name": "Charlie Patel (Foodie Neighbor)",
        "email": "charlie@foodshare.local",
        "role": "buyer",
        "phone": "+1-555-0187",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
    },
    {
        "id": "buyer-diana",
        "name": "Diana Vance (Local Resident)",
        "email": "diana@foodshare.local",
        "role": "buyer",
        "phone": "+1-555-0164",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
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
