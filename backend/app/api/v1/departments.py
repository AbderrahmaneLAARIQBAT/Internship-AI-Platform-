import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentDetailResponse,
    PaginatedDepartments,
)
from app.schemas.common import APIResponse
from app.repositories.department_repository import department_repository
from app.api.deps import get_current_user, require_staff
from app.models.user import User

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=PaginatedDepartments)
def list_departments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * size
    items, total = department_repository.get_all(db, skip=skip, limit=size, search=search)
    pages = math.ceil(total / size) if total > 0 else 1
    return PaginatedDepartments(items=items, total=total, page=page, size=size, pages=pages)


@router.get("/{dept_id}", response_model=DepartmentDetailResponse)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dept = department_repository.get_by_id(db, dept_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    skills_data = []
    for ds in dept.skills:
        if ds.skill:
            skills_data.append({
                "id": ds.skill_id,
                "name": ds.skill.name,
                "importance": ds.importance,
            })
    result = DepartmentDetailResponse.model_validate(dept)
    result.skills = skills_data
    return result


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    existing = department_repository.get_by_name(db, data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department with this name already exists",
        )
    return department_repository.create(db, data)


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    dept = department_repository.get_by_id(db, dept_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return department_repository.update(db, dept, data)


@router.delete("/{dept_id}", response_model=APIResponse)
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    dept = department_repository.get_by_id(db, dept_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    department_repository.delete(db, dept)
    return APIResponse(message="Department deleted successfully")
