from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.core.database import get_db
from app.schemas.common import DashboardStats, CandidatesByStatus, TopSkill, DepartmentCapacity
from app.models.candidate import Candidate, CandidateStatus
from app.models.application import Application, ApplicationStatus
from app.models.department import Department
from app.models.skill import Skill, CandidateSkill
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_candidates = db.query(Candidate).count()
    total_applications = db.query(Application).count()
    total_departments = db.query(Department).count()
    pending_apps = db.query(Application).filter(Application.status == ApplicationStatus.pending).count()
    accepted_apps = db.query(Application).filter(Application.status == ApplicationStatus.accepted).count()
    rejected_apps = db.query(Application).filter(Application.status == ApplicationStatus.rejected).count()
    shortlisted = db.query(Candidate).filter(Candidate.status == CandidateStatus.shortlisted).count()

    avg_score_result = db.query(func.avg(Candidate.ai_score)).scalar()
    avg_score = round(float(avg_score_result or 0), 1)

    return DashboardStats(
        total_candidates=total_candidates,
        total_applications=total_applications,
        total_departments=total_departments,
        pending_applications=pending_apps,
        accepted_applications=accepted_apps,
        rejected_applications=rejected_apps,
        avg_ai_score=avg_score,
        shortlisted_candidates=shortlisted,
    )


@router.get("/candidates-by-status", response_model=List[CandidatesByStatus])
def candidates_by_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(Candidate.status, func.count(Candidate.id).label("count"))
        .group_by(Candidate.status)
        .all()
    )
    return [CandidatesByStatus(status=r.status.value, count=r.count) for r in results]


@router.get("/top-skills", response_model=List[TopSkill])
def top_skills(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(Skill.name, func.count(CandidateSkill.candidate_id).label("candidate_count"))
        .join(CandidateSkill, Skill.id == CandidateSkill.skill_id)
        .group_by(Skill.name)
        .order_by(func.count(CandidateSkill.candidate_id).desc())
        .limit(limit)
        .all()
    )
    return [TopSkill(skill_name=r.name, candidate_count=r.candidate_count) for r in results]


@router.get("/departments-capacity", response_model=List[DepartmentCapacity])
def departments_capacity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    departments = db.query(Department).all()
    result = []
    for dept in departments:
        fill = (dept.current_count / dept.capacity * 100) if dept.capacity > 0 else 0
        result.append(DepartmentCapacity(
            department_name=dept.name,
            capacity=dept.capacity,
            current_count=dept.current_count,
            fill_percentage=round(fill, 1),
        ))
    return result

@router.get("/activity-trend")
def activity_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime
    
    today = datetime.utcnow()
    results = []
    
    for i in range(6, -1, -1):
        y = today.year
        m = today.month - i
        while m <= 0:
            m += 12
            y -= 1
            
        start_date = datetime(y, m, 1)
        if m == 12:
            end_date = datetime(y + 1, 1, 1)
        else:
            end_date = datetime(y, m + 1, 1)
            
        month_label = start_date.strftime('%b')
        
        cands_count = db.query(Candidate).filter(
            Candidate.created_at >= start_date,
            Candidate.created_at < end_date
        ).count()
        
        apps_count = db.query(Application).filter(
            Application.created_at >= start_date,
            Application.created_at < end_date
        ).count()
        
        results.append({
            "month": month_label,
            "candidates": cands_count,
            "applications": apps_count
        })
        
    return results
