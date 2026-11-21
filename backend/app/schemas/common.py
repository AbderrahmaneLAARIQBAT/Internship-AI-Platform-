from typing import Any, Optional, List, Dict
from pydantic import BaseModel


class APIResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Optional[Any] = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    size: int
    pages: int


class DashboardStats(BaseModel):
    total_candidates: int
    total_applications: int
    total_departments: int
    pending_applications: int
    accepted_applications: int
    rejected_applications: int
    avg_ai_score: float
    shortlisted_candidates: int


class CandidatesByStatus(BaseModel):
    status: str
    count: int


class TopSkill(BaseModel):
    skill_name: str
    candidate_count: int


class DepartmentCapacity(BaseModel):
    department_name: str
    capacity: int
    current_count: int
    fill_percentage: float
