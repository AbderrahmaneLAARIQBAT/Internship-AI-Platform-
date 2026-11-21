from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


class UserRepository:

    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        role: Optional[UserRole] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[User], int]:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        if search:
            query = query.filter(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                )
            )
        total = query.count()
        items = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def create(self, db: Session, data: UserCreate) -> User:
        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=get_password_hash(data.password),
            role=data.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update(self, db: Session, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user

    def delete(self, db: Session, user: User) -> None:
        db.delete(user)
        db.commit()


user_repository = UserRepository()
