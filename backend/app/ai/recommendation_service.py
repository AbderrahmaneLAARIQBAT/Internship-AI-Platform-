"""
Recommendation Service — Recommends the best department for a candidate
based on their extracted skills and profile.
"""
from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional

from app.ai.matching_engine import compute_match_score

logger = logging.getLogger(__name__)


def recommend_department(
    candidate_skills: List[Dict[str, Any]],
    departments: List[Dict[str, Any]],
    candidate_degree: Optional[str] = None,
    graduation_year: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Score all departments and return the best match with full ranking.

    Args:
        candidate_skills: list of {"name": str, "level": str}
        departments: list of {"id": int, "name": str, "skills": [{"name", "importance"}]}
        candidate_degree: degree string
        graduation_year: graduation year int

    Returns:
        {
            "recommended_department_id": int,
            "recommended_department_name": str,
            "score": float,
            "rankings": [{"department_id", "department_name", "score"}]
        }
    """
    if not departments:
        return {
            "recommended_department_id": None,
            "recommended_department_name": None,
            "score": 0.0,
            "rankings": [],
        }

    rankings = []
    for dept in departments:
        score = compute_match_score(
            candidate_skills=candidate_skills,
            department_skills=dept.get("skills", []),
            candidate_degree=candidate_degree,
            graduation_year=graduation_year,
        )
        rankings.append({
            "department_id": dept["id"],
            "department_name": dept["name"],
            "score": score,
        })

    rankings.sort(key=lambda x: x["score"], reverse=True)
    best = rankings[0]

    return {
        "recommended_department_id": best["department_id"],
        "recommended_department_name": best["department_name"],
        "score": best["score"],
        "rankings": rankings,
    }
