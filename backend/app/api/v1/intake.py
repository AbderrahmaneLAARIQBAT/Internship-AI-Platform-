"""
Intake API — exposes candidate intake endpoints for CSV import and Google Form webhook.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, require_staff
from app.models.user import User
from app.services.intake.pipeline import intake_pipeline
from app.services.intake.providers.csv_import import CsvImportProvider
from app.services.intake.providers.webhook import (
    GoogleFormPayload,
    GoogleFormProvider,
    is_configured,
    validate_secret,
)
from app.services.audit_service import log_action
from app.services.notification_service import notify_all_staff_sync

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/intake", tags=["Candidate Intake"])


# ── Response schemas ──────────────────────────────────────────────────────────

class ImportError(BaseModel):
    row: int
    error: str


class ImportSummaryResponse(BaseModel):
    total: int
    imported: int
    skipped: int
    failed: int
    errors: List[ImportError] = []


# ── CSV Import ─────────────────────────────────────────────────────────────────

@router.post("/csv", response_model=ImportSummaryResponse, status_code=status.HTTP_200_OK)
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """
    Bulk-import candidates from a CSV file.

    Required CSV columns: first_name, last_name, email
    Optional columns: phone, university, degree, graduation_year, linkedin_url, github_url, notes

    Returns an import summary with imported / skipped / failed counts.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted (.csv)")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=413, detail="CSV file too large (max 5 MB)")

    provider = CsvImportProvider()
    try:
        candidates, parse_errors = provider.get_candidates(csv_bytes=content)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse CSV: {exc}")

    # Run through intake pipeline
    results = intake_pipeline.process_batch(
        db=db,
        candidates=candidates,
        user_id=current_user.id,
        trigger_ai=True,
    )

    imported = sum(1 for r in results if r.action == "created")
    skipped = sum(1 for r in results if r.action == "skipped")
    failed = sum(1 for r in results if r.action == "failed")
    pipeline_errors = [
        {"row": 0, "error": f"{r.email}: {r.error}"}
        for r in results if r.action == "failed" and r.error
    ]

    all_errors = [{"row": e["row"], "error": e["error"]} for e in (parse_errors + pipeline_errors)]

    # Audit log the CSV import
    try:
        log_action(
            db=db,
            action="csv_import",
            entity_type="import",
            user_id=current_user.id,
            details={
                "filename": file.filename,
                "total": len(results) + len(parse_errors),
                "imported": imported,
                "skipped": skipped,
                "failed": failed + len(parse_errors),
            },
        )
    except Exception:
        pass

    # Notify staff if any were imported
    if imported > 0:
        try:
            notify_all_staff_sync(
                db=db,
                title="CSV Import Completed",
                message=f"Imported {imported} candidates, skipped {skipped}, failed {failed}.",
                notif_type="info",
                link="/candidates",
            )
        except Exception:
            pass

    return ImportSummaryResponse(
        total=len(results) + len(parse_errors),
        imported=imported,
        skipped=skipped,
        failed=failed + len(parse_errors),
        errors=all_errors,
    )


# ── Google Form Webhook ───────────────────────────────────────────────────────

@router.post("/webhook/google-form", status_code=status.HTTP_200_OK)
async def google_form_webhook(
    payload: GoogleFormPayload,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Google Apps Script webhook endpoint.
    This endpoint is OPTIONAL — returns 403 if GOOGLE_FORM_WEBHOOK_SECRET is not configured.
    """
    if not is_configured():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google Form integration is not configured on this server.",
        )

    if not validate_secret(payload.secret):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid webhook secret.",
        )

    if not payload.email:
        raise HTTPException(status_code=422, detail="email is required")

    provider = GoogleFormProvider()
    candidates = provider.get_candidates(payload=payload)

    ip = request.client.host if request.client else None

    def _process():
        result = intake_pipeline.process_one(
            db=db,
            intake=candidates[0],
            trigger_ai=True,
        )
        try:
            log_action(
                db=db,
                action="webhook_received",
                entity_type="candidate",
                entity_id=result.candidate_id,
                details={"source": "google_form", "email": result.email, "action": result.action},
                ip_address=ip,
            )
        except Exception:
            pass

    background_tasks.add_task(_process)
    return {"success": True, "message": "Submission received and queued for processing."}


# ── Audit Log endpoint ────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    user_id: Optional[int] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


@router.get("/audit-log", response_model=List[AuditLogResponse])
def get_audit_log(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Return the most recent audit log entries (admin/hr only)."""
    from app.models.audit_log import AuditLog
    entries = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "action": e.action,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "user_id": e.user_id,
            "details": e.details,
            "ip_address": e.ip_address,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]
