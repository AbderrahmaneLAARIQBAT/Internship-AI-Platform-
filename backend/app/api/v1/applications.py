import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.application import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ApplicationResponse,
    PaginatedApplications,
)
from app.schemas.common import APIResponse
from app.repositories.application_repository import application_repository
from app.repositories.candidate_repository import candidate_repository
from app.repositories.department_repository import department_repository
from app.api.deps import get_current_user, require_staff
from app.models.user import User
from app.models.application import ApplicationStatus
from app.ai.matching_engine import compute_match_score

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify candidate and department exist
    candidate = candidate_repository.get_by_id(db, data.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    dept = department_repository.get_by_id(db, data.department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Compute matching score
    candidate_skills = [
        {"name": cs.skill.name if cs.skill else "", "level": cs.level.value}
        for cs in candidate.skills
    ]
    dept_skills = [
        {"name": ds.skill.name if ds.skill else "", "importance": ds.importance}
        for ds in dept.skills
    ]
    score = compute_match_score(
        candidate_skills=candidate_skills,
        department_skills=dept_skills,
        candidate_degree=candidate.degree,
        graduation_year=candidate.graduation_year,
    )

    return application_repository.create(db, data, matching_score=score)


@router.get("", response_model=PaginatedApplications)
def list_applications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[ApplicationStatus] = None,
    candidate_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * size
    items, total = application_repository.get_all(
        db, skip=skip, limit=size, status=status,
        candidate_id=candidate_id, department_id=department_id
    )
    pages = math.ceil(total / size) if total > 0 else 1
    return PaginatedApplications(items=items, total=total, page=page, size=size, pages=pages)


@router.put("/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(
    app_id: int,
    data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    application = application_repository.get_by_id(db, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application_repository.update_status(db, application, data)


@router.delete("/{app_id}", response_model=APIResponse)
def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    application = application_repository.get_by_id(db, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    application_repository.delete(db, application)
    return APIResponse(message="Application deleted successfully")
