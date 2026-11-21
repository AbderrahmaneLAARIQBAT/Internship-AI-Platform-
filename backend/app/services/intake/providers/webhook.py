"""
Google Form Webhook Provider — converts an inbound Google Apps Script
POST payload into an IntakeCandidate.

This provider is OPTIONAL. If GOOGLE_FORM_WEBHOOK_SECRET is not set in
the environment/.env, the webhook endpoint returns HTTP 403 gracefully.
"""
from __future__ import annotations

import os
from typing import List
from pydantic import BaseModel

from app.services.intake.base import IntakeCandidate, IntakeProvider


WEBHOOK_SECRET = os.getenv("GOOGLE_FORM_WEBHOOK_SECRET", "")


class GoogleFormPayload(BaseModel):
    secret: str
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    university: str = ""
    degree: str = ""
    graduation_year: int | None = None
    linkedin_url: str = ""
    github_url: str = ""
    cv_drive_url: str = ""
    submitted_at: str = ""


def is_configured() -> bool:
    """Returns True if the webhook secret is set in the environment."""
    return bool(WEBHOOK_SECRET)


def validate_secret(secret: str) -> bool:
    return WEBHOOK_SECRET and secret == WEBHOOK_SECRET


class GoogleFormProvider(IntakeProvider):
    """Converts a validated Google Form payload into an IntakeCandidate."""

    @property
    def source_name(self) -> str:
        return "google_form"

    def get_candidates(self, payload: GoogleFormPayload, **kwargs) -> List[IntakeCandidate]:
        return [
            IntakeCandidate(
                first_name=payload.first_name.strip(),
                last_name=payload.last_name.strip(),
                email=payload.email.strip().lower(),
                phone=payload.phone or None,
                university=payload.university or None,
                degree=payload.degree or None,
                graduation_year=payload.graduation_year,
                linkedin_url=payload.linkedin_url or None,
                github_url=payload.github_url or None,
                intake_source="google_form",
                extra={"cv_drive_url": payload.cv_drive_url, "submitted_at": payload.submitted_at},
            )
        ]
