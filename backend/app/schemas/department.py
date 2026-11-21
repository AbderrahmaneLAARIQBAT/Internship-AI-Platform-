from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DepartmentSkillBrief(BaseModel):
    id: int
    name: str
    importance: float

    model_config = {"from_attributes": True}


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int = 5


class DepartmentCreate(DepartmentBase):
    manager_id: Optional[int] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    manager_id: Optional[int] = None


class DepartmentResponse(DepartmentBase):
    id: int
    current_count: int
    manager_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DepartmentDetailResponse(DepartmentResponse):
    skills: List[DepartmentSkillBrief] = []

    model_config = {"from_attributes": True}


class PaginatedDepartments(BaseModel):
    items: List[DepartmentResponse]
    total: int
    page: int
    size: int
    pages: int
