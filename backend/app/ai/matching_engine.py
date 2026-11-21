"""
Matching Engine — Computes a weighted score between a candidate's skills
and a department's required skills.

Score formula:
    score = (skill_match_ratio * 0.70) + (education_match * 0.20) + (experience_bonus * 0.10)

Result is normalized to [0, 100].
"""
from __future__ import annotations

import logging
import os
import pickle
import numpy as np
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Try to load the trained ML model
ML_MODEL = None
try:
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'match_model.pkl')
    if os.path.exists(model_path):
        with open(model_path, 'rb') as f:
            ML_MODEL = pickle.load(f)
        logger.info(f"Loaded custom ML model from {model_path}")
except Exception as e:
    logger.warning(f"Could not load ML model, falling back to heuristic: {e}")

# Education keywords → score mapping
EDUCATION_SCORES: Dict[str, float] = {
    "phd": 1.0,
    "doctorat": 1.0,
    "master": 0.9,
    "msc": 0.9,
    "mba": 0.85,
    "ingénieur": 0.88,
    "engineer": 0.88,
    "bachelor": 0.75,
    "licence": 0.75,
    "bsc": 0.75,
    "bts": 0.60,
    "dut": 0.60,
}

# Level weights
LEVEL_WEIGHTS: Dict[str, float] = {
    "beginner": 0.4,
    "intermediate": 0.65,
    "advanced": 0.85,
    "expert": 1.0,
}


def _education_score(degree: Optional[str]) -> float:
    if not degree:
        return 0.5
    degree_lower = degree.lower()
    for keyword, score in EDUCATION_SCORES.items():
        if keyword in degree_lower:
            return score
    return 0.5


def compute_match_score(
    candidate_skills: List[Dict[str, Any]],
    department_skills: List[Dict[str, Any]],
    candidate_degree: Optional[str] = None,
    graduation_year: Optional[int] = None,
) -> float:
    """
    Compute a match score between candidate and department.

    Args:
        candidate_skills: list of {"name": str, "level": str}
        department_skills: list of {"name": str, "importance": float}
        candidate_degree: e.g. "Master Software Engineering"
        graduation_year: e.g. 2025

    Returns:
        float in [0, 100]
    """
    if not department_skills:
        return 0.0

    # Candidate skill lookup: name → level weight
    candidate_map: Dict[str, float] = {}
    for cs in candidate_skills:
        name = cs.get("name", "").lower()
        level = cs.get("level", "beginner")
        candidate_map[name] = LEVEL_WEIGHTS.get(level, 0.4)

    # Weighted skill matching
    total_importance = sum(ds.get("importance", 1.0) for ds in department_skills)
    if total_importance == 0:
        total_importance = 1.0

    matched_weight = 0.0
    for ds in department_skills:
        dep_skill_name = ds.get("name", "").lower()
        importance = ds.get("importance", 1.0)
        level_weight = candidate_map.get(dep_skill_name, 0.0)
        matched_weight += level_weight * importance

    skill_match_ratio = min(matched_weight / total_importance, 1.0)

    # Education match
    education_match = _education_score(candidate_degree)

    # Experience bonus (recent graduates get a small bonus)
    import datetime
    current_year = datetime.datetime.now().year
    experience_bonus = 0.5
    if graduation_year:
        years_diff = abs(current_year - graduation_year)
        if years_diff <= 1:
            experience_bonus = 0.9
        elif years_diff <= 3:
            experience_bonus = 0.7
        else:
            experience_bonus = 0.5

    if ML_MODEL is not None:
        try:
            vectorizer = ML_MODEL.get('vectorizer')
            clf = ML_MODEL.get('classifier')
            if vectorizer and clf:
                # 1. Prepare Text for NLP
                cand_skills_text = " ".join([cs.get("name", "") for cs in candidate_skills])
                dep_skills_text = " ".join([ds.get("name", "") for ds in department_skills])
                
                # 2. Vectorize and Compute NLP Similarity
                X_cv = vectorizer.transform([cand_skills_text])
                X_vac = vectorizer.transform([dep_skills_text])
                nlp_similarity = np.asarray(X_cv.multiply(X_vac).sum(axis=1)).flatten()[0]
                
                # 3. Calculate Experience
                exp_years = float(current_year - graduation_year) if graduation_year else 0.0
                
                # 4. Predict using the trained ML model
                features = np.array([[nlp_similarity, exp_years]])
                prob_hired = clf.predict_proba(features)[0][1]
                
                # Scale up to 0-100
                score = round(prob_hired * 100.0, 1)
                
                logger.debug(f"NLP Match score: {score} (nlp_sim={nlp_similarity:.4f}, exp={exp_years})")
                return score
        except Exception as e:
            logger.error(f"NLP Prediction failed: {e}. Falling back to formula.")

    # Weighted formula (Fallback)
    raw_score = (
        skill_match_ratio * 0.70
        + education_match * 0.20
        + experience_bonus * 0.10
    )

    # Normalize to [0, 100] and round to 1 decimal
    score = round(min(max(raw_score * 100, 0.0), 100.0), 1)
    logger.debug(
        f"Match score: {score} "
        f"(skill={skill_match_ratio:.2f}, edu={education_match:.2f}, exp={experience_bonus:.2f})"
    )
    return score


def rank_candidates(
    candidates: List[Dict[str, Any]],
    department_skills: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Rank a list of candidates for a given department.

    Args:
        candidates: list of {id, skills: [{name, level}], degree, graduation_year}
        department_skills: list of {name, importance}

    Returns:
        Sorted list with score added.
    """
    scored = []
    for c in candidates:
        candidate_skills = c.get("skills", [])
        score = compute_match_score(
            candidate_skills=candidate_skills,
            department_skills=department_skills,
            candidate_degree=c.get("degree"),
            graduation_year=c.get("graduation_year"),
        )
        
        # Determine strengths and weaknesses
        candidate_skill_names = {cs.get("name", "").lower() for cs in candidate_skills}
        strengths = []
        weaknesses = []
        for ds in department_skills:
            ds_name = ds.get("name", "")
            if ds_name.lower() in candidate_skill_names:
                strengths.append(ds_name)
            else:
                weaknesses.append(ds_name)
                
        scored.append({
            **c, 
            "matching_score": score,
            "strengths": strengths,
            "weaknesses": weaknesses
        })
    return sorted(scored, key=lambda x: x["matching_score"], reverse=True)
