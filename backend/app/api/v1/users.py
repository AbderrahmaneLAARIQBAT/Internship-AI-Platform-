from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.common import APIResponse
from app.repositories.user_repository import user_repository
from app.api.deps import require_admin, require_staff
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """List all users (Admin/HR only)."""
    users = db.query(User).all()
    return users

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user account (Admin only)."""
    existing = user_repository.get_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = user_repository.create(db, data)
    return user

@router.delete("/{user_id}", response_model=APIResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a user account (Admin only)."""
    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    
    db.delete(user)
    db.commit()
    return APIResponse(message="User deleted successfully")
