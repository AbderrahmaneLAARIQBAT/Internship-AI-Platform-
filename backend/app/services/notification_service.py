"""
Notification service — creates in-app notifications for staff users.
Extends the existing create_and_send_notification with sync helpers for the intake pipeline.
"""
from __future__ import annotations

import logging
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User, UserRole
from app.api.v1.notifications import manager

logger = logging.getLogger(__name__)


async def create_and_send_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    message: str,
    link: str = None,
) -> Notification:
    """Creates a notification in DB and broadcasts it via WebSocket."""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Broadcast in real-time
    await manager.send_personal_message(
        {
            "id": notif.id,
            "type": notif.type,
            "title": notif.title,
            "message": notif.message,
            "is_read": notif.is_read,
            "link": notif.link,
        },
        user_id,
    )
    return notif


def notify_user_sync(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "info",
    link: Optional[str] = None,
) -> Notification:
    """Synchronous variant for use inside background tasks and the intake pipeline."""
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notif)
    db.commit()
    return notif


def notify_all_staff_sync(
    db: Session,
    title: str,
    message: str,
    notif_type: str = "info",
    link: Optional[str] = None,
    roles: Optional[List[UserRole]] = None,
) -> int:
    """Broadcast a notification to all active admin/hr users (synchronously)."""
    target_roles = roles or [UserRole.admin, UserRole.hr]
    users: List[User] = (
        db.query(User)
        .filter(User.role.in_(target_roles), User.is_active == True)
        .all()
    )
    count = 0
    for user in users:
        try:
            notify_user_sync(db, user.id, title, message, notif_type, link)
            count += 1
        except Exception as exc:
            logger.error(f"[Notify] Failed to notify user {user.id}: {exc}")
    return count
