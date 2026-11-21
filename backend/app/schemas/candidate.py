from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

from app.models.candidate import CandidateStatus, WorkflowStage, IntakeSource


class SkillBrief(BaseModel):
    id: int
    name: str
    level: str

    model_config = {"from_attributes": True}


class CandidateBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    education_history: Optional[List[dict]] = None
    work_experience: Optional[List[dict]] = None
    certifications: Optional[List[Any]] = None
    notes: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    date_of_birth: Optional[str] = None


class CandidateCreate(CandidateBase):
    skills: Optional[List[str]] = None


class CandidateUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    work_experience: Optional[List[dict]] = None
    certifications: Optional[List[Any]] = None
    notes: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    status: Optional[CandidateStatus] = None
    workflow_stage: Optional[WorkflowStage] = None
    recommended_department_id: Optional[int] = None
    ai_score: Optional[float] = None
    skills: Optional[List[str]] = None


class CandidateResponse(CandidateBase):
    id: int
    cv_file: Optional[str] = None
    motivation_letter_file: Optional[str] = None
    # Basic AI
    ai_score: Optional[float] = 0.0
    ai_confidence: Optional[float] = 0.0
    # Rich AI
    ai_summary: Optional[str] = None
    ai_strengths: Optional[List[str]] = None
    ai_weaknesses: Optional[List[str]] = None
    ai_interview_questions: Optional[List[str]] = None
    ai_matched_skills: Optional[List[str]] = None
    ai_missing_skills: Optional[List[str]] = None
    ai_explanation: Optional[str] = None
    ai_alt_departments: Optional[List[Any]] = None
    ai_languages: Optional[List[str]] = None
    ai_experience_years: Optional[int] = None
    work_experience: Optional[List[dict]] = None
    certifications: Optional[List[Any]] = None
    # Workflow & intake
    workflow_stage: WorkflowStage = WorkflowStage.new
    intake_source: IntakeSource = IntakeSource.manual
    recommended_department_id: Optional[int] = None
    status: CandidateStatus
    created_at: datetime
    updated_at: datetime
    skills: List[SkillBrief] = []

    model_config = {"from_attributes": True}


class CandidateDetailResponse(CandidateResponse):
    skills: List[SkillBrief] = []

    model_config = {"from_attributes": True}


class PaginatedCandidates(BaseModel):
    items: List[CandidateResponse]
    total: int
    page: int
    size: int
    pages: int
