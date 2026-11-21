"""
Audit logging service — records every important action in the platform.
"""
from __future__ import annotations

import logging
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Record an auditable action. Never raises — logs errors and continues."""
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
            ip_address=ip_address,
        )
        db.add(entry)
        db.commit()
        return entry
    except Exception as exc:
        logger.error(f"[AuditLog] Failed to record action '{action}': {exc}")
        db.rollback()
        raise
