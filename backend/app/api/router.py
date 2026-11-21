from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.candidates import router as candidates_router
from app.api.v1.departments import router as departments_router
from app.api.v1.applications import router as applications_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.ai import router as ai_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.emails import router as emails_router
from app.api.v1.settings import router as settings_router
from app.api.v1.users import router as users_router
from app.api.v1.intake import router as intake_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(candidates_router)
api_router.include_router(departments_router)
api_router.include_router(applications_router)
api_router.include_router(analytics_router)
api_router.include_router(ai_router)
api_router.include_router(notifications_router)
api_router.include_router(emails_router)
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])
api_router.include_router(intake_router)
