import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    hr = "hr"
    manager = "manager"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(512), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.hr)
    is_active = Column(Boolean, nullable=False, default=True)
    avatar_url = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    managed_departments = relationship("Department", back_populates="manager")
    reviewed_applications = relationship("Application", back_populates="reviewer", foreign_keys="Application.reviewer_id")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
