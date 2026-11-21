from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.schemas.auth import Token, LoginRequest, RefreshRequest
from app.schemas.user import UserCreate, UserResponse
from app.repositories.user_repository import user_repository
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])





@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login and receive JWT access + refresh tokens."""
    user = user_repository.get_by_email(db, data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    """Obtain a new access token using a refresh token."""
    payload = decode_token(data.refresh_token)
    verify_token_type(payload, "refresh")
    user_id = payload.get("sub")
    user = user_repository.get_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token_new = create_refresh_token({"sub": str(user.id)})
    return Token(access_token=access_token, refresh_token=refresh_token_new)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user profile."""
    return current_user
