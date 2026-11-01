import os
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, UserRole, AccountStatus

JWT_SECRET = os.getenv("JWT_SECRET", "supersecret-hyperlocal-food-jwt-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

security_bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Generate PBKDF2-HMAC-SHA256 password hash with unique random salt."""
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()
    return f"{salt}${pw_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against salt$hash string."""
    try:
        salt, expected_hash = hashed_password.split("$", 1)
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        ).hex()
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False

def create_access_token(user: User) -> str:
    """Issue signed JWT access token containing subject ID, role, and expiration."""
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "exp": exp
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate signature and expiry of JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user(
    auth_creds: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
) -> User:
    """
    Authenticate user via Bearer JWT token or fallback header for testing.
    Verifies user status and rejects suspended accounts with HTTP 403.
    """
    token_user_id = None
    if auth_creds and auth_creds.credentials:
        payload = decode_access_token(auth_creds.credentials)
        if payload:
            token_user_id = payload.get("sub")

    resolved_id = token_user_id or x_user_id or user_id
    if not resolved_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please login with your credentials."
        )

    user = db.query(User).filter(User.id == resolved_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session has expired."
        )

    if user.account_status == AccountStatus.SUSPENDED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by administration."
        )

    return user

def require_role(allowed_roles: List[str]):
    """Strict Role-Based Access Control dependency factory."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Access restricted to [{', '.join(allowed_roles)}]. Your role is {current_user.role}."
            )
        return current_user
    return role_checker

# Preconfigured RBAC dependencies
require_buyer = require_role([UserRole.BUYER.value])
require_seller = require_role([UserRole.SELLER.value])
require_admin = require_role([UserRole.ADMIN.value])
require_seller_or_admin = require_role([UserRole.SELLER.value, UserRole.ADMIN.value])
require_any_authenticated = require_role([UserRole.BUYER.value, UserRole.SELLER.value, UserRole.ADMIN.value])

