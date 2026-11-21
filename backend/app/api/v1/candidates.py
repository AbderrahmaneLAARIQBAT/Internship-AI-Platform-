import os
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    CandidateDetailResponse,
    PaginatedCandidates,
)
from app.schemas.common import APIResponse
from app.repositories.candidate_repository import candidate_repository
from app.api.deps import get_current_user, require_staff
from app.models.user import User
from app.models.candidate import CandidateStatus

router = APIRouter(prefix="/candidates", tags=["Candidates"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _validate_file(file: UploadFile) -> None:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOCX, JPG, and PNG files are allowed",
        )


@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = candidate_repository.get_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Candidate profile already exists with this email",
        )
    return candidate_repository.create(db, data)


@router.get("", response_model=PaginatedCandidates)
def list_candidates(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=1000),
    status: Optional[CandidateStatus] = None,
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * size
    items, total = candidate_repository.get_all(
        db, skip=skip, limit=size, status=status, search=search, department_id=department_id
    )
    pages = math.ceil(total / size) if total > 0 else 1
    return PaginatedCandidates(items=items, total=total, page=page, size=size, pages=pages)


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = candidate_repository.get_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    # Build skill list
    skills_data = []
    for cs in candidate.skills:
        skills_data.append({
            "id": cs.skill_id,
            "name": cs.skill.name if cs.skill else "",
            "level": cs.level.value if cs.level else "beginner",
        })
    
    base_response = CandidateResponse.model_validate(candidate)
    result_dict = base_response.model_dump()
    result_dict["skills"] = skills_data
    
    return CandidateDetailResponse(**result_dict)


@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int,
    data: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    candidate = candidate_repository.get_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return candidate_repository.update(db, candidate, data)


@router.delete("/{candidate_id}", response_model=APIResponse)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    candidate = candidate_repository.get_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    candidate_repository.delete(db, candidate)
    return APIResponse(message="Candidate deleted successfully")


@router.post("/{candidate_id}/upload-cv", response_model=APIResponse)
async def upload_cv(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_file(file)
    candidate = candidate_repository.get_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "cv")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"cv_{candidate_id}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)
    db_path = f"cv/{filename}"

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    with open(filepath, "wb") as f:
        f.write(content)

    candidate_repository.update_cv(db, candidate, db_path)
    return APIResponse(message="CV uploaded successfully", data={"filepath": db_path})


@router.post("/{candidate_id}/upload-letter", response_model=APIResponse)
async def upload_letter(
    candidate_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_file(file)
    candidate = candidate_repository.get_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "letters")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"letter_{candidate_id}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)
    db_path = f"letters/{filename}"

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    with open(filepath, "wb") as f:
        f.write(content)

    candidate_repository.update_letter(db, candidate, db_path)
    return APIResponse(message="Motivation letter uploaded successfully", data={"filepath": db_path})
