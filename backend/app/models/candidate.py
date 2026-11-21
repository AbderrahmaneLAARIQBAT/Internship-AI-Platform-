import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CandidateStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    shortlisted = "shortlisted"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class WorkflowStage(str, enum.Enum):
    new = "new"
    ai_processing = "ai_processing"
    ready_for_review = "ready_for_review"
    hr_review = "hr_review"
    manager_review = "manager_review"
    interview = "interview"
    accepted = "accepted"
    rejected = "rejected"


class IntakeSource(str, enum.Enum):
    manual = "manual"
    csv = "csv"
    google_form = "google_form"
    api = "api"
    email = "email"


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    # Identity
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    date_of_birth = Column(String(100), nullable=True)
    # Education & profile
    university = Column(String(255), nullable=True)
    degree = Column(String(255), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    education_history = Column(JSON, nullable=True)  # list[{university, degree, graduation_year}]
    work_experience = Column(JSON, nullable=True)  # list[{company, job_title, start_date, end_date, description}]
    certifications = Column(JSON, nullable=True)  # list[str] or list[{name, issuer, date}]
    # Documents
    cv_file = Column(String(512), nullable=True)
    motivation_letter_file = Column(String(512), nullable=True)
    # AI analysis — basic
    ai_score = Column(Float, default=0.0)
    ai_confidence = Column(Float, default=0.0)
    # AI analysis — rich
    ai_summary = Column(Text, nullable=True)
    ai_strengths = Column(JSON, nullable=True)       # list[str]
    ai_weaknesses = Column(JSON, nullable=True)      # list[str]
    ai_interview_questions = Column(JSON, nullable=True)  # list[str]
    ai_matched_skills = Column(JSON, nullable=True)  # list[str]
    ai_missing_skills = Column(JSON, nullable=True)  # list[str]
    ai_explanation = Column(Text, nullable=True)
    ai_alt_departments = Column(JSON, nullable=True) # list[{id, name, score}]
    ai_languages = Column(JSON, nullable=True)       # list[str]
    ai_experience_years = Column(Integer, nullable=True)
    # Workflow & intake
    workflow_stage = Column(
        Enum(WorkflowStage, name="workflow_stage"),
        nullable=False,
        default=WorkflowStage.new,
    )
    intake_source = Column(
        Enum(IntakeSource, name="intake_source"),
        nullable=False,
        default=IntakeSource.manual,
    )
    recommended_department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(CandidateStatus, name="candidate_status"), nullable=False, default=CandidateStatus.pending)
    notes = Column(Text, nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    github_url = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    recommended_department = relationship("Department", foreign_keys=[recommended_department_id])
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Candidate id={self.id} email={self.email} status={self.status}>"
