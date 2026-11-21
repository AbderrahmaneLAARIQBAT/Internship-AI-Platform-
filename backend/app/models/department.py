from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    capacity = Column(Integer, nullable=False, default=5)
    current_count = Column(Integer, nullable=False, default=0)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    manager = relationship("User", back_populates="managed_departments")
    skills = relationship("DepartmentSkill", back_populates="department", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="department")
    recommended_candidates = relationship("Candidate", foreign_keys="Candidate.recommended_department_id", overlaps="recommended_department")

    def __repr__(self) -> str:
        return f"<Department id={self.id} name={self.name}>"


class DepartmentSkill(Base):
    __tablename__ = "department_skills"

    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    importance = Column(Float, nullable=False, default=1.0)

    # Relationships
    department = relationship("Department", back_populates="skills")
    skill = relationship("Skill", back_populates="departments")

    @property
    def id(self):
        return self.skill_id

    @property
    def name(self):
        return self.skill.name if self.skill else ""
