"""
CSV Import Provider — parses a CSV file and produces IntakeCandidate objects.

Expected CSV headers (case-insensitive):
  first_name, last_name, email, phone, university, degree,
  graduation_year, linkedin_url, github_url, notes

Returns an ImportSummary with per-row results.
"""
from __future__ import annotations

import csv
import io
import logging
from dataclasses import dataclass, field
from typing import List, Tuple

from app.services.intake.base import IntakeCandidate, IntakeProvider

logger = logging.getLogger(__name__)

# Map of accepted CSV header aliases → canonical field name
HEADER_MAP: dict = {
    "first_name": "first_name",
    "firstname": "first_name",
    "first": "first_name",
    "prénom": "first_name",
    "last_name": "last_name",
    "lastname": "last_name",
    "last": "last_name",
    "nom": "last_name",
    "email": "email",
    "e-mail": "email",
    "mail": "email",
    "phone": "phone",
    "telephone": "phone",
    "tel": "phone",
    "university": "university",
    "université": "university",
    "school": "university",
    "degree": "degree",
    "diplôme": "degree",
    "graduation_year": "graduation_year",
    "year": "graduation_year",
    "linkedin_url": "linkedin_url",
    "linkedin": "linkedin_url",
    "github_url": "github_url",
    "github": "github_url",
    "notes": "notes",
    "comment": "notes",
}


def _map_headers(raw_headers: List[str]) -> dict:
    """Map raw CSV headers to canonical field names."""
    mapping = {}
    for i, h in enumerate(raw_headers):
        canonical = HEADER_MAP.get(h.strip().lower())
        if canonical:
            mapping[canonical] = i
    return mapping


@dataclass
class ImportSummary:
    total: int = 0
    imported: int = 0
    skipped: int = 0
    failed: int = 0
    errors: List[dict] = field(default_factory=list)

    @property
    def updated(self) -> int:
        return 0  # CSV import does not update existing records


class CsvImportProvider(IntakeProvider):
    """Reads a CSV byte stream and returns a list of IntakeCandidate objects."""

    @property
    def source_name(self) -> str:
        return "csv"

    def get_candidates(self, csv_bytes: bytes, **kwargs) -> Tuple[List[IntakeCandidate], List[dict]]:
        """
        Parse CSV bytes into IntakeCandidate objects.

        Returns:
            (candidates, row_errors) where row_errors is a list of {row, error} dicts.
        """
        text = csv_bytes.decode("utf-8-sig", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)

        if not rows:
            return [], [{"row": 0, "error": "CSV file is empty"}]

        raw_headers = rows[0]
        mapping = _map_headers(raw_headers)

        if "email" not in mapping:
            return [], [{"row": 1, "error": "CSV must have an 'email' column"}]
        if "first_name" not in mapping or "last_name" not in mapping:
            return [], [{"row": 1, "error": "CSV must have 'first_name' and 'last_name' columns"}]

        candidates: List[IntakeCandidate] = []
        errors: List[dict] = []

        for row_num, row in enumerate(rows[1:], start=2):
            if not any(cell.strip() for cell in row):
                continue  # skip blank lines
            try:
                def get(field_name: str) -> str:
                    idx = mapping.get(field_name)
                    if idx is None or idx >= len(row):
                        return ""
                    return row[idx].strip()

                grad_year_str = get("graduation_year")
                grad_year = int(grad_year_str) if grad_year_str.isdigit() else None

                candidates.append(
                    IntakeCandidate(
                        first_name=get("first_name"),
                        last_name=get("last_name"),
                        email=get("email").lower(),
                        phone=get("phone") or None,
                        university=get("university") or None,
                        degree=get("degree") or None,
                        graduation_year=grad_year,
                        linkedin_url=get("linkedin_url") or None,
                        github_url=get("github_url") or None,
                        notes=get("notes") or None,
                        intake_source="csv",
                    )
                )
            except Exception as exc:
                errors.append({"row": row_num, "error": str(exc)})

        return candidates, errors
