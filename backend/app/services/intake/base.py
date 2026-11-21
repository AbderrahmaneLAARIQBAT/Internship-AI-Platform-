"""
Intake pipeline base classes.
Every candidate source implements IntakeProvider.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class IntakeCandidate:
    """
    Normalised candidate data produced by every intake provider.
    All fields map directly to the Candidate model.
    """
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    notes: Optional[str] = None
    # Path to a locally stored CV file (if already downloaded)
    cv_file_path: Optional[str] = None
    # Raw CV text (skip download+parse if already available)
    cv_raw_text: Optional[str] = None
    # Intake metadata
    intake_source: str = "manual"
    extra: dict = field(default_factory=dict)


@dataclass
class IntakeResult:
    """Result of processing one IntakeCandidate through the pipeline."""
    success: bool
    candidate_id: Optional[int] = None
    action: str = "created"        # "created" | "updated" | "skipped"
    email: str = ""
    error: Optional[str] = None


class IntakeProvider(ABC):
    """
    Abstract base for all candidate intake sources.
    Subclasses yield IntakeCandidate objects; the pipeline processes them.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Short identifier for this provider, e.g. 'csv', 'google_form'."""

    @abstractmethod
    def get_candidates(self, **kwargs) -> List[IntakeCandidate]:
        """Return a list of IntakeCandidate objects from this source."""
