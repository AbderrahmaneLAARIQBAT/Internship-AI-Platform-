from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload

from app.models.department import Department, DepartmentSkill
from app.models.skill import Skill
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentRepository:

    def get_by_id(self, db: Session, dept_id: int) -> Optional[Department]:
        return (
            db.query(Department)
            .options(joinedload(Department.skills).joinedload(DepartmentSkill.skill))
            .filter(Department.id == dept_id)
            .first()
        )

    def get_by_name(self, db: Session, name: str) -> Optional[Department]:
        return db.query(Department).filter(Department.name == name).first()

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> Tuple[List[Department], int]:
        query = db.query(Department)
        if search:
            query = query.filter(Department.name.ilike(f"%{search}%"))
        total = query.count()
        items = query.order_by(Department.name).offset(skip).limit(limit).all()
        return items, total

    def create(self, db: Session, data: DepartmentCreate) -> Department:
        dept = Department(**data.model_dump())
        db.add(dept)
        db.commit()
        db.refresh(dept)
        return dept

    def update(self, db: Session, dept: Department, data: DepartmentUpdate) -> Department:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(dept, key, value)
        db.commit()
        db.refresh(dept)
        return dept

    def delete(self, db: Session, dept: Department) -> None:
        db.delete(dept)
        db.commit()


department_repository = DepartmentRepository()
