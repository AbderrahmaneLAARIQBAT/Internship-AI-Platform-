import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AuditAction(str, enum.Enum):
    candidate_created = "candidate_created"
    candidate_updated = "candidate_updated"
    candidate_deleted = "candidate_deleted"
    candidate_status_changed = "candidate_status_changed"
    ai_analysis_completed = "ai_analysis_completed"
    application_created = "application_created"
    application_status_changed = "application_status_changed"
    department_assigned = "department_assigned"
    csv_import = "csv_import"
    webhook_received = "webhook_received"
    user_login = "user_login"
    user_created = "user_created"
    settings_changed = "settings_changed"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True)   # e.g. "candidate", "application"
    entity_id = Column(Integer, nullable=True, index=True)
    details = Column(JSON, nullable=True)              # arbitrary metadata
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", backref="audit_logs", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action} entity={self.entity_type}:{self.entity_id}>"
