"""
Intake Pipeline — processes every IntakeCandidate through the same steps
regardless of the source (manual form, CSV, Google Form, API, etc.).

Steps:
  1. Validate required fields
  2. Duplicate detection by email
  3. Store candidate in DB
  4. Trigger AI analysis as a background task
  5. Send notifications to HR/Admin staff
  6. Write audit log entry
"""
from __future__ import annotations

import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.services.intake.base import IntakeCandidate, IntakeResult
from app.repositories.candidate_repository import candidate_repository
from app.schemas.candidate import CandidateCreate
from app.models.candidate import WorkflowStage, IntakeSource
from app.services.audit_service import log_action
from app.services.notification_service import notify_all_staff_sync

logger = logging.getLogger(__name__)


class IntakePipeline:
    """
    Processes a list of IntakeCandidate objects through validation,
    dedup, persistence, AI scheduling, and notification.
    """

    def process_one(
        self,
        db: Session,
        intake: IntakeCandidate,
        user_id: Optional[int] = None,
        trigger_ai: bool = True,
    ) -> IntakeResult:
        """Run the full pipeline for a single candidate. Returns IntakeResult."""
        email = (intake.email or "").strip().lower()

        # ── 1. Validate ────────────────────────────────────────────────────────
        if not intake.first_name or not intake.last_name or not email:
            return IntakeResult(
                success=False,
                email=email,
                action="failed",
                error="first_name, last_name and email are required",
            )
        if "@" not in email or "." not in email.split("@")[-1]:
            return IntakeResult(
                success=False,
                email=email,
                action="failed",
                error=f"Invalid email address: {email}",
            )

        # ── 2. Duplicate detection ─────────────────────────────────────────────
        existing = candidate_repository.get_by_email(db, email)
        if existing:
            return IntakeResult(
                success=True,
                candidate_id=existing.id,
                email=email,
                action="skipped",
            )

        # ── 3. Persist ────────────────────────────────────────────────────────
        try:
            data = CandidateCreate(
                first_name=intake.first_name.strip(),
                last_name=intake.last_name.strip(),
                email=email,
                phone=intake.phone or None,
                university=intake.university or None,
                degree=intake.degree or None,
                graduation_year=intake.graduation_year,
                linkedin_url=intake.linkedin_url or None,
                github_url=intake.github_url or None,
                notes=intake.notes or None,
            )
            candidate = candidate_repository.create(db, data)

            # Set intake-specific fields directly
            candidate.intake_source = IntakeSource(intake.intake_source)
            candidate.workflow_stage = WorkflowStage.new
            if intake.cv_file_path:
                candidate.cv_file = intake.cv_file_path
            db.commit()
            db.refresh(candidate)

        except Exception as exc:
            db.rollback()
            logger.error(f"[Intake] DB error for {email}: {exc}")
            return IntakeResult(
                success=False,
                email=email,
                action="failed",
                error=str(exc),
            )

        # ── 4. Trigger AI analysis in background ──────────────────────────────
        if trigger_ai and candidate.cv_file:
            try:
                from app.ai.analysis_pipeline import enqueue_analysis
                enqueue_analysis(candidate.id)
            except Exception as exc:
                logger.warning(f"[Intake] Could not enqueue AI for {candidate.id}: {exc}")

        # ── 5. Notifications ──────────────────────────────────────────────────
        try:
            notify_all_staff_sync(
                db=db,
                title="New Candidate Received",
                message=f"{candidate.first_name} {candidate.last_name} ({email}) "
                        f"submitted via {intake.intake_source}.",
                notif_type="success",
                link=f"/candidates/{candidate.id}",
            )
        except Exception as exc:
            logger.warning(f"[Intake] Notification failed: {exc}")

        # ── 6. Audit ──────────────────────────────────────────────────────────
        try:
            log_action(
                db=db,
                action="candidate_created",
                entity_type="candidate",
                entity_id=candidate.id,
                user_id=user_id,
                details={
                    "email": email,
                    "source": intake.intake_source,
                    "name": f"{candidate.first_name} {candidate.last_name}",
                },
            )
        except Exception as exc:
            logger.warning(f"[Intake] Audit log failed: {exc}")

        return IntakeResult(
            success=True,
            candidate_id=candidate.id,
            email=email,
            action="created",
        )

    def process_batch(
        self,
        db: Session,
        candidates: List[IntakeCandidate],
        user_id: Optional[int] = None,
        trigger_ai: bool = True,
    ) -> List[IntakeResult]:
        """Process a list of IntakeCandidate objects. Returns all results."""
        results = []
        for intake in candidates:
            result = self.process_one(db, intake, user_id=user_id, trigger_ai=trigger_ai)
            results.append(result)
        return results


# Module-level singleton
intake_pipeline = IntakePipeline()
