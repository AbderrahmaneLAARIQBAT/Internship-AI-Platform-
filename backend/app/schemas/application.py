from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.application import ApplicationStatus


class ApplicationBase(BaseModel):
    candidate_id: int
    department_id: int
    cover_message: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    reviewer_id: Optional[int] = None


class AppCandidateResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    model_config = {"from_attributes": True}

class AppDepartmentResponse(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class ApplicationResponse(ApplicationBase):
    id: int
    matching_score: float
    status: ApplicationStatus
    reviewer_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    candidate: Optional[AppCandidateResponse] = None
    department: Optional[AppDepartmentResponse] = None

    model_config = {"from_attributes": True}


class PaginatedApplications(BaseModel):
    items: List[ApplicationResponse]
    total: int
    page: int
    size: int
    pages: int
