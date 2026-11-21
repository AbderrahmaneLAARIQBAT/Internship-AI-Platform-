import enum
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    matching_score = Column(Float, default=0.0)
    status = Column(Enum(ApplicationStatus, name="application_status"), nullable=False, default=ApplicationStatus.pending)
    cover_message = Column(Text, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="applications")
    department = relationship("Department", back_populates="applications")
    reviewer = relationship("User", back_populates="reviewed_applications", foreign_keys=[reviewer_id])

    def __repr__(self) -> str:
        return f"<Application id={self.id} candidate_id={self.candidate_id} department_id={self.department_id}>"
