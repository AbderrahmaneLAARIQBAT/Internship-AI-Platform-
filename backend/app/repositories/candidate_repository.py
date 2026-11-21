from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.models.candidate import Candidate, CandidateStatus
from app.schemas.candidate import CandidateCreate, CandidateUpdate


class CandidateRepository:

    def get_by_id(self, db: Session, candidate_id: int) -> Optional[Candidate]:
        return (
            db.query(Candidate)
            .options(joinedload(Candidate.skills))
            .filter(Candidate.id == candidate_id)
            .first()
        )

    def get_by_email(self, db: Session, email: str) -> Optional[Candidate]:
        return db.query(Candidate).filter(Candidate.email == email).first()

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        status: Optional[CandidateStatus] = None,
        search: Optional[str] = None,
        department_id: Optional[int] = None,
    ) -> Tuple[List[Candidate], int]:
        query = db.query(Candidate)
        
        if status:
            query = query.filter(Candidate.status == status)
        if department_id:
            query = query.filter(Candidate.recommended_department_id == department_id)
        if search:
            query = query.filter(
                or_(
                    Candidate.first_name.ilike(f"%{search}%"),
                    Candidate.last_name.ilike(f"%{search}%"),
                    Candidate.email.ilike(f"%{search}%"),
                    Candidate.university.ilike(f"%{search}%"),
                    Candidate.degree.ilike(f"%{search}%"),
                )
            )
        total = query.count()
        items = (
            query.order_by(Candidate.ai_score.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

    def create(self, db: Session, data: CandidateCreate) -> Candidate:
        data_dict = data.model_dump()
        skills_data = data_dict.pop("skills", []) or []
        candidate = Candidate(**data_dict)
        db.add(candidate)
        db.flush()
        
        if skills_data:
            self._sync_skills(db, candidate, skills_data)
            
        db.commit()
        db.refresh(candidate)
        return candidate

    def update(self, db: Session, candidate: Candidate, data: CandidateUpdate) -> Candidate:
        update_data = data.model_dump(exclude_unset=True)
        skills_data = update_data.pop("skills", None)
        
        for key, value in update_data.items():
            setattr(candidate, key, value)
            
        if skills_data is not None:
            self._sync_skills(db, candidate, skills_data)
            
        db.commit()
        db.refresh(candidate)
        return candidate

    def _sync_skills(self, db: Session, candidate: Candidate, skills: List[str]):
        from app.models.skill import Skill, CandidateSkill, SkillLevel
        
        # Remove existing skills
        db.query(CandidateSkill).filter(CandidateSkill.candidate_id == candidate.id).delete()
        
        for skill_name in skills:
            skill_name = skill_name.strip()
            if not skill_name:
                continue
            skill = db.query(Skill).filter(func.lower(Skill.name) == skill_name.lower()).first()
            if not skill:
                skill = Skill(name=skill_name)
                db.add(skill)
                db.flush()
            
            cs = CandidateSkill(candidate_id=candidate.id, skill_id=skill.id, level=SkillLevel.intermediate)
            db.add(cs)

    def update_cv(self, db: Session, candidate: Candidate, filepath: str) -> Candidate:
        candidate.cv_file = filepath
        db.commit()
        db.refresh(candidate)
        return candidate

    def update_letter(self, db: Session, candidate: Candidate, filepath: str) -> Candidate:
        candidate.motivation_letter_file = filepath
        db.commit()
        db.refresh(candidate)
        return candidate

    def delete(self, db: Session, candidate: Candidate) -> None:
        db.delete(candidate)
        db.commit()


candidate_repository = CandidateRepository()
