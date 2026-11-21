"""
Full AI Analysis Pipeline — runs every AI step for a candidate and
saves the enriched result back to the database.

Steps:
  1. Load candidate from DB
  2. Parse CV (text extraction)
  3. Extract skills (NLP + fuzzy match)
  4. Recommend department + compute match score
  5. LLM enrichment: summary, strengths/weaknesses, interview questions, explanation
  6. Calculate confidence score
  7. Save everything to Candidate record
  8. Update workflow_stage → ready_for_review
"""
from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


def run_full_analysis(candidate_id: int, db=None) -> dict:
    """
    Run complete AI analysis for a candidate.
    Can be called directly or via enqueue_analysis() as a background task.

    Returns a dict with all analysis results.
    """
    from app.core.database import SessionLocal
    from app.models.candidate import Candidate, WorkflowStage
    from app.repositories.candidate_repository import candidate_repository
    from app.repositories.department_repository import department_repository
    from app.ai.cv_parser import parse_cv
    from app.ai.skill_extractor import extract_skills
    from app.ai.matching_engine import compute_match_score
    from app.ai.recommendation_service import recommend_department
    from app.models.skill import Skill, CandidateSkill, SkillLevel
    from app.services.audit_service import log_action
    from app.services.notification_service import notify_all_staff_sync

    close_db = db is None
    if db is None:
        db = SessionLocal()

    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.error(f"[AI Pipeline] Candidate {candidate_id} not found")
            return {"error": "Candidate not found"}

        # Mark as processing
        candidate.workflow_stage = WorkflowStage.ai_processing
        db.commit()

        result: dict = {}

        # ── Step 1: Parse CV ──────────────────────────────────────────────────
        parsed_cv = {}
        if candidate.cv_file and os.path.exists(candidate.cv_file):
            try:
                parsed_cv = parse_cv(candidate.cv_file)
                logger.info(f"[AI Pipeline] CV parsed for candidate {candidate_id}")
            except Exception as exc:
                logger.warning(f"[AI Pipeline] CV parse failed: {exc}")

        raw_text = parsed_cv.get("raw_text", "")

        # Fill missing candidate fields from CV
        if not candidate.first_name and parsed_cv.get("first_name"):
            candidate.first_name = parsed_cv["first_name"]
        if not candidate.last_name and parsed_cv.get("last_name"):
            candidate.last_name = parsed_cv["last_name"]
        if not candidate.university and parsed_cv.get("education"):
            candidate.university = parsed_cv["education"]
        if parsed_cv.get("languages"):
            candidate.ai_languages = parsed_cv["languages"]
        if parsed_cv.get("experience_years"):
            candidate.ai_experience_years = parsed_cv["experience_years"]
        if parsed_cv.get("work_experience"):
            candidate.work_experience = parsed_cv["work_experience"]
        if parsed_cv.get("certifications"):
            candidate.certifications = parsed_cv["certifications"]
        db.flush()

        # ── Step 2: Extract skills ────────────────────────────────────────────
        skill_names = []
        if raw_text:
            try:
                skill_names = extract_skills(raw_text)
                # Persist skills to DB
                for skill_name in skill_names[:20]:
                    skill = db.query(Skill).filter(Skill.name.ilike(skill_name)).first()
                    if not skill:
                        skill = Skill(name=skill_name.title())
                        db.add(skill)
                        db.flush()
                    already = db.query(CandidateSkill).filter_by(
                        candidate_id=candidate.id, skill_id=skill.id
                    ).first()
                    if not already:
                        cs = CandidateSkill(
                            candidate_id=candidate.id,
                            skill_id=skill.id,
                            level=SkillLevel.intermediate,
                        )
                        db.add(cs)
                db.flush()
            except Exception as exc:
                logger.warning(f"[AI Pipeline] Skill extraction failed: {exc}")

        # ── Step 3: Department matching + recommendation ───────────────────────
        candidate_skills_data = [
            {"name": cs.skill.name if cs.skill else "", "level": cs.level.value}
            for cs in candidate.skills
        ]

        depts, _ = department_repository.get_all(db, limit=100)
        departments_data = []
        for d in depts:
            dept_full = department_repository.get_by_id(db, d.id)
            dept_skills = [
                {"name": ds.skill.name if ds.skill else "", "importance": ds.importance}
                for ds in (dept_full.skills if dept_full else [])
            ]
            departments_data.append({"id": d.id, "name": d.name, "skills": dept_skills})

        rec = recommend_department(
            candidate_skills=candidate_skills_data,
            departments=departments_data,
            candidate_degree=candidate.degree,
            graduation_year=candidate.graduation_year,
        )

        best_score = rec.get("score", 0.0)
        best_dept_id = rec.get("recommended_department_id")
        best_dept_name = rec.get("recommended_department_name", "")
        alt_depts = rec.get("rankings", [])[1:4]  # next 3 alternatives

        # Compute matched / missing skills for the recommended dept
        matched_skills = []
        missing_skills = []
        if best_dept_id:
            dept_full = department_repository.get_by_id(db, best_dept_id)
            if dept_full:
                candidate_skill_names_lower = {s["name"].lower() for s in candidate_skills_data}
                for ds in dept_full.skills:
                    name = ds.skill.name if ds.skill else ""
                    if name.lower() in candidate_skill_names_lower:
                        matched_skills.append(name)
                    else:
                        missing_skills.append(name)

        # Confidence = ratio of dept required skills that candidate has
        total_dept_skills = len(matched_skills) + len(missing_skills)
        confidence = round(len(matched_skills) / total_dept_skills * 100, 1) if total_dept_skills > 0 else best_score

        # ── Step 4: LLM enrichment ────────────────────────────────────────────
        summary = ""
        strengths = []
        weaknesses = []
        interview_questions = []
        explanation = ""

        try:
            from app.ai.llm_provider import get_llm_provider
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import StrOutputParser
            import json as json_lib

            llm = get_llm_provider()

            candidate_context = (
                f"Name: {candidate.first_name} {candidate.last_name}\n"
                f"Degree: {candidate.degree or 'Unknown'}\n"
                f"University: {candidate.university or 'Unknown'}\n"
                f"Graduation Year: {candidate.graduation_year or 'Unknown'}\n"
                f"Skills: {', '.join(skill_names[:15]) or 'None extracted'}\n"
                f"Recommended Department: {best_dept_name}\n"
                f"Match Score: {best_score}%\n"
                f"Matched Skills: {', '.join(matched_skills[:10])}\n"
                f"Missing Skills: {', '.join(missing_skills[:10])}\n"
                f"CV Excerpt: {raw_text[:800] if raw_text else 'No CV available'}"
            )

            # Generate summary + strengths + weaknesses + questions in one call
            analysis_prompt = ChatPromptTemplate.from_messages([
                ("system",
                 "You are an expert HR analyst. Analyze the candidate profile and respond with "
                 "ONLY valid JSON in this exact structure (no markdown, no extra text):\n"
                 '{{"summary": "2-3 sentence professional summary", '
                 '"strengths": ["strength1", "strength2", "strength3"], '
                 '"weaknesses": ["weakness1", "weakness2"], '
                 '"interview_questions": ["question1", "question2", "question3", "question4", "question5"], '
                 '"explanation": "1-2 sentence explanation of why this department was recommended"}}'),
                ("human", "{context}")
            ])

            chain = analysis_prompt | llm | StrOutputParser()
            raw_response = chain.invoke({"context": candidate_context})

            # Parse JSON response
            try:
                # Strip markdown code blocks if present
                clean = raw_response.strip()
                if clean.startswith("```"):
                    clean = clean.split("```")[1]
                    if clean.startswith("json"):
                        clean = clean[4:]
                parsed = json_lib.loads(clean.strip())
                summary = parsed.get("summary", "")
                strengths = parsed.get("strengths", [])
                weaknesses = parsed.get("weaknesses", [])
                interview_questions = parsed.get("interview_questions", [])
                explanation = parsed.get("explanation", "")
            except Exception as parse_exc:
                logger.warning(f"[AI Pipeline] Failed to parse LLM JSON: {parse_exc}")
                summary = raw_response[:500]

        except Exception as exc:
            logger.warning(f"[AI Pipeline] LLM enrichment skipped: {exc}")
            # Provide rule-based fallbacks
            if skill_names:
                strengths = [f"Proficient in {s}" for s in skill_names[:3]]
            if missing_skills:
                weaknesses = [f"Missing {s} skills" for s in missing_skills[:2]]
            explanation = f"Best match based on skill overlap with {best_dept_name}." if best_dept_name else ""

        # ── Step 5: Save everything ───────────────────────────────────────────
        candidate.ai_score = best_score
        candidate.ai_confidence = confidence
        candidate.ai_summary = summary
        candidate.ai_strengths = strengths
        candidate.ai_weaknesses = weaknesses
        candidate.ai_interview_questions = interview_questions
        candidate.ai_matched_skills = matched_skills
        candidate.ai_missing_skills = missing_skills
        candidate.ai_explanation = explanation
        candidate.ai_alt_departments = alt_depts
        candidate.recommended_department_id = best_dept_id
        candidate.workflow_stage = WorkflowStage.ready_for_review
        db.commit()

        # Notify staff
        try:
            notify_all_staff_sync(
                db=db,
                title="AI Analysis Complete",
                message=(
                    f"Analysis for {candidate.first_name} {candidate.last_name} is ready. "
                    f"Match score: {best_score}% for {best_dept_name or 'no department'}."
                ),
                notif_type="info",
                link=f"/candidates/{candidate_id}",
            )
        except Exception:
            pass

        # Audit
        try:
            log_action(
                db=db,
                action="ai_analysis_completed",
                entity_type="candidate",
                entity_id=candidate_id,
                details={"score": best_score, "confidence": confidence, "department": best_dept_name},
            )
        except Exception:
            pass

        result = {
            "candidate_id": candidate_id,
            "ai_score": best_score,
            "ai_confidence": confidence,
            "ai_summary": summary,
            "ai_strengths": strengths,
            "ai_weaknesses": weaknesses,
            "ai_interview_questions": interview_questions,
            "ai_matched_skills": matched_skills,
            "ai_missing_skills": missing_skills,
            "ai_explanation": explanation,
            "recommended_department_id": best_dept_id,
            "recommended_department_name": best_dept_name,
            "ai_alt_departments": alt_depts,
        }
        logger.info(f"[AI Pipeline] Completed for candidate {candidate_id}: score={best_score}")
        return result

    except Exception as exc:
        logger.error(f"[AI Pipeline] Fatal error for candidate {candidate_id}: {exc}", exc_info=True)
        try:
            candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
            if candidate:
                from app.models.candidate import WorkflowStage
                candidate.workflow_stage = WorkflowStage.ready_for_review
                db.commit()
        except Exception:
            pass
        return {"error": str(exc)}
    finally:
        if close_db:
            db.close()


def enqueue_analysis(candidate_id: int) -> None:
    """
    Schedule AI analysis to run in a background thread.
    Uses a simple thread to avoid blocking the request.
    """
    import threading
    thread = threading.Thread(
        target=run_full_analysis,
        args=(candidate_id,),
        daemon=True,
        name=f"ai-analysis-{candidate_id}",
    )
    thread.start()
    logger.info(f"[AI Pipeline] Enqueued analysis for candidate {candidate_id}")
