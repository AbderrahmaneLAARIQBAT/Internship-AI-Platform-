from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.department import Department
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate


class ApplicationRepository:

    def get_by_id(self, db: Session, app_id: int) -> Optional[Application]:
        return (
            db.query(Application)
            .options(
                joinedload(Application.candidate),
                joinedload(Application.department),
            )
            .filter(Application.id == app_id)
            .first()
        )

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        status: Optional[ApplicationStatus] = None,
        candidate_id: Optional[int] = None,
        department_id: Optional[int] = None,
    ) -> Tuple[List[Application], int]:
        query = db.query(Application).options(
            joinedload(Application.candidate),
            joinedload(Application.department),
        )
        if status:
            query = query.filter(Application.status == status)
        if candidate_id:
            query = query.filter(Application.candidate_id == candidate_id)
        if department_id:
            query = query.filter(Application.department_id == department_id)
        total = query.count()
        items = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def create(self, db: Session, data: ApplicationCreate, matching_score: float = 0.0) -> Application:
        app = Application(**data.model_dump(), matching_score=matching_score)
        db.add(app)
        db.commit()
        db.refresh(app)
        return app

    def update_status(
        self,
        db: Session,
        application: Application,
        data: ApplicationStatusUpdate,
    ) -> Application:
        application.status = data.status
        if data.reviewer_id:
            application.reviewer_id = data.reviewer_id
            application.reviewed_at = datetime.utcnow()
        db.commit()
        db.refresh(application)
        return application

    def delete(self, db: Session, application: Application) -> None:
        db.delete(application)
        db.commit()


application_repository = ApplicationRepository()
