from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr
from app.api.deps import get_current_user, require_staff
from app.models.user import User
from app.services.email_service import send_status_email
from app.schemas.common import APIResponse

router = APIRouter(prefix="/emails", tags=["Emails"])

class EmailRequest(BaseModel):
    email: EmailStr
    name: str
    status: str
    message: str = ""

@router.post("/send-status", response_model=APIResponse)
async def send_status(
    req: EmailRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_staff)
):
    """Manually trigger a status email to a candidate."""
    try:
        background_tasks.add_task(
            send_status_email,
            email_to=req.email,
            name=req.name,
            status=req.status,
            custom_message=req.message
        )
        return APIResponse(message="Email queued for sending")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
