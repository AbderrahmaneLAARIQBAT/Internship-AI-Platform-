from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# ── WebSocket Manager ──────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

manager = ConnectionManager()

# ── WebSocket Endpoint ─────────────────────────────────────────────────────────
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # In a real enterprise app, we'd validate a JWT token passed in the query params.
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Just keeping the connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# ── REST Endpoints ─────────────────────────────────────────────────────────────
class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    link: str | None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all notifications for the current user."""
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50).all()
    return notifications

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"success": True}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read for the current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"success": True}
