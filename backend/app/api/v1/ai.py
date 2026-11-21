from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.ai.cv_parser import parse_cv
from app.ai.skill_extractor import extract_skills
from app.ai.matching_engine import compute_match_score, rank_candidates
from app.ai.recommendation_service import recommend_department
from app.repositories.candidate_repository import candidate_repository
from app.repositories.department_repository import department_repository

router = APIRouter(prefix="/ai", tags=["AI Services"])


class ExtractSkillsRequest(BaseModel):
    text: str


class RecommendRequest(BaseModel):
    candidate_id: int


class RankCandidatesRequest(BaseModel):
    candidate_ids: List[int]
    department_id: int


class ChatRequest(BaseModel):
    query: str
    context_data: Optional[str] = None
    candidate_id: Optional[int] = None  # inject real candidate context
    department_id: Optional[int] = None # inject real department context


class InterviewQuestionsRequest(BaseModel):
    candidate_id: int
    department_id: Optional[int] = None


class GenerateEmailRequest(BaseModel):
    candidate_id: int
    email_type: str  # "acceptance" | "rejection" | "interview"
    additional_notes: Optional[str] = None


class CompareCandidatesRequest(BaseModel):
    candidate_ids: List[int]
    department_id: Optional[int] = None


class AnalyzeMatchRequest(BaseModel):
    candidate_id: int
    department_id: int


# ── CV Analysis ───────────────────────────────────────────────────────────────

@router.post("/analyze-cv")
async def analyze_cv(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
):
    """Upload and analyze a CV PDF to extract structured data."""
    import os
    allowed_exts = (".pdf", ".docx", ".jpg", ".jpeg", ".png")
    ext = os.path.splitext(file.filename.lower())[1] if file.filename else ""
    if not file.filename or ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, JPG, and PNG files are accepted")

    import tempfile
    content = await file.read()
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = parse_cv(tmp_path)
    finally:
        os.unlink(tmp_path)

    if result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"CV parsing provider failed: {result['error']}",
        )

    return {"success": True, "data": result}


# ── Skill Extraction ──────────────────────────────────────────────────────────

@router.post("/extract-skills")
def extract_skills_endpoint(
    data: ExtractSkillsRequest,
    current_user: User = Depends(get_current_user),
):
    """Extract technical skills from a text passage."""
    skills = extract_skills(data.text)
    return {"success": True, "data": {"skills": skills, "count": len(skills)}}


# ── Department Recommendation ─────────────────────────────────────────────────

@router.post("/recommend-department")
def recommend_department_endpoint(
    data: RecommendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recommend the best matching department for a candidate."""
    candidate = candidate_repository.get_by_id(db, data.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate_skills = [
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

    result = recommend_department(
        candidate_skills=candidate_skills,
        departments=departments_data,
        candidate_degree=candidate.degree,
        graduation_year=candidate.graduation_year,
    )
    return {"success": True, "data": result}


# ── Rank Candidates ───────────────────────────────────────────────────────────

@router.post("/rank-candidates")
def rank_candidates_endpoint(
    data: RankCandidatesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rank a list of candidates for a specific department."""
    dept = department_repository.get_by_id(db, data.department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    dept_skills = [
        {"name": ds.skill.name if ds.skill else "", "importance": ds.importance}
        for ds in dept.skills
    ]

    candidates_data = []
    for cid in data.candidate_ids:
        c = candidate_repository.get_by_id(db, cid)
        if c:
            candidates_data.append({
                "id": c.id,
                "name": f"{c.first_name} {c.last_name}".strip(),
                "skills": [
                    {"name": cs.skill.name if cs.skill else "", "level": cs.level.value}
                    for cs in c.skills
                ],
                "degree": c.degree,
                "graduation_year": c.graduation_year,
            })

    ranked = rank_candidates(candidates_data, dept_skills)
    return {"success": True, "data": {"department": dept.name, "rankings": ranked}}


# ── Analyze Candidate-Department Match ────────────────────────────────────────

@router.post("/analyze-match")
def analyze_match_endpoint(
    data: AnalyzeMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provide a detailed AI breakdown of a candidate's fit for a department."""
    candidate = candidate_repository.get_by_id(db, data.candidate_id)
    dept = department_repository.get_by_id(db, data.department_id)
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    try:
        from app.ai.llm_provider import get_llm_provider
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        import json

        candidate_skills = [cs.skill.name for cs in candidate.skills if cs.skill]
        dept_skills = [ds.skill.name for ds in dept.skills if ds.skill]

        context = (
            f"Candidate: {candidate.first_name} {candidate.last_name}\n"
            f"Degree: {candidate.degree or 'N/A'}\n"
            f"Candidate Skills: {', '.join(candidate_skills) or 'None listed'}\n\n"
            f"Department: {dept.name}\n"
            f"Department Description: {dept.description or 'N/A'}\n"
            f"Department Required Skills: {', '.join(dept_skills) or 'None listed'}"
        )

        llm = get_llm_provider()
        prompt = ChatPromptTemplate.from_messages([
            ("system", 
             "You are an expert HR analyst. Analyze the fit between the candidate and the department. "
             "Return ONLY a valid JSON object with the following keys:\n"
             "{{\n"
             '  "overall_fit": "A paragraph describing the overall fit",\n'
             '  "strengths": ["strength 1", "strength 2"],\n'
             '  "weaknesses": ["weakness 1", "weakness 2"],\n'
             '  "recommendation": "Final recommendation string"\n'
             "}}"),
            ("human", "{context}")
        ])
        chain = prompt | llm | StrOutputParser()
        raw = chain.invoke({"context": context})

        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        analysis = json.loads(clean)

        return {"success": True, "data": analysis}
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"LLM match analysis failed: {exc}")


# ── Full AI Analysis ──────────────────────────────────────────────────────────

@router.post("/run-analysis/{candidate_id}")
def run_analysis(
    candidate_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger the full AI analysis pipeline for a candidate.
    Runs in the background and updates the candidate record when complete.
    """
    candidate = candidate_repository.get_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    from app.ai.analysis_pipeline import enqueue_analysis
    enqueue_analysis(candidate_id)

    return {"success": True, "message": "AI analysis started. Results will be available shortly."}


# ── Interview Questions ───────────────────────────────────────────────────────

@router.post("/interview-questions")
def generate_interview_questions(
    data: InterviewQuestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate tailored interview questions for a candidate."""
    import os
    candidate = candidate_repository.get_by_id(db, data.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Return cached questions if available
    if candidate.ai_interview_questions:
        return {"success": True, "data": {"questions": candidate.ai_interview_questions}}

    # Generate via LLM
    try:
        from app.ai.llm_provider import get_llm_provider
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        import json

        dept_name = ""
        if data.department_id:
            dept = department_repository.get_by_id(db, data.department_id)
            if dept:
                dept_name = dept.name
        elif candidate.recommended_department_id:
            dept = department_repository.get_by_id(db, candidate.recommended_department_id)
            if dept:
                dept_name = dept.name

        skills = [cs.skill.name for cs in candidate.skills if cs.skill]
        context = (
            f"Candidate: {candidate.first_name} {candidate.last_name}\n"
            f"Degree: {candidate.degree or 'N/A'}\n"
            f"Skills: {', '.join(skills[:10]) or 'Not listed'}\n"
            f"Department: {dept_name or 'General'}"
        )

        llm = get_llm_provider()
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert technical interviewer. Generate exactly 8 interview questions "
                       "tailored to this candidate's profile and target department. Return ONLY a JSON array "
                       "of strings. No numbering, no markdown."),
            ("human", "{context}")
        ])
        chain = prompt | llm | StrOutputParser()
        raw = chain.invoke({"context": context})

        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        questions = json.loads(clean)
        if not isinstance(questions, list):
            questions = [str(questions)]

        # Cache result
        candidate.ai_interview_questions = questions
        db.commit()

        return {"success": True, "data": {"questions": questions}}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {exc}")


# ── Email Generation ──────────────────────────────────────────────────────────

@router.post("/generate-email")
def generate_email(
    data: GenerateEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a professional acceptance, rejection, or interview invitation email."""
    candidate = candidate_repository.get_by_id(db, data.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    email_types = {"acceptance", "rejection", "interview"}
    if data.email_type not in email_types:
        raise HTTPException(status_code=422, detail=f"email_type must be one of {email_types}")

    try:
        from app.ai.llm_provider import get_llm_provider
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        dept_name = ""
        if candidate.recommended_department_id:
            dept = department_repository.get_by_id(db, candidate.recommended_department_id)
            if dept:
                dept_name = dept.name

        llm = get_llm_provider()
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             f"You are an HR professional writing a {data.email_type} email. "
             "Write a professional, warm, and concise email in English. "
             "Include subject line starting with 'Subject:' on the first line, "
             "then a blank line, then the email body."),
            ("human",
             f"Candidate name: {candidate.first_name} {candidate.last_name}\n"
             f"Department: {dept_name or 'the internship program'}\n"
             f"Email type: {data.email_type}\n"
             f"Additional notes: {data.additional_notes or 'None'}")
        ])
        chain = prompt | llm | StrOutputParser()
        email_text = chain.invoke({})
        return {"success": True, "data": {"email": email_text}}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Email generation failed: {exc}")


# ── Compare Candidates ────────────────────────────────────────────────────────

@router.post("/compare-candidates")
def compare_candidates(
    data: CompareCandidatesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare two or more candidates side-by-side with AI analysis."""
    if len(data.candidate_ids) < 2:
        raise HTTPException(status_code=422, detail="Provide at least 2 candidate IDs to compare")
    if len(data.candidate_ids) > 5:
        raise HTTPException(status_code=422, detail="Maximum 5 candidates can be compared at once")

    candidates_info = []
    for cid in data.candidate_ids:
        c = candidate_repository.get_by_id(db, cid)
        if not c:
            raise HTTPException(status_code=404, detail=f"Candidate {cid} not found")
        candidates_info.append({
            "id": c.id,
            "name": f"{c.first_name} {c.last_name}",
            "degree": c.degree,
            "university": c.university,
            "ai_score": c.ai_score,
            "ai_confidence": c.ai_confidence,
            "ai_summary": c.ai_summary,
            "skills": [cs.skill.name for cs in c.skills if cs.skill],
            "matched_skills": c.ai_matched_skills or [],
            "missing_skills": c.ai_missing_skills or [],
            "strengths": c.ai_strengths or [],
            "weaknesses": c.ai_weaknesses or [],
        })

    try:
        from app.ai.llm_provider import get_llm_provider
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        import json

        context = "\n\n".join(
            f"Candidate {i+1} — {c['name']}:\n"
            f"  Score: {c['ai_score']}%  Confidence: {c['ai_confidence']}%\n"
            f"  Degree: {c['degree'] or 'N/A'}  University: {c['university'] or 'N/A'}\n"
            f"  Skills: {', '.join(c['skills'][:10])}\n"
            f"  Strengths: {', '.join(c['strengths'][:3])}\n"
            f"  Weaknesses: {', '.join(c['weaknesses'][:2])}"
            for i, c in enumerate(candidates_info)
        )

        llm = get_llm_provider()
        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a senior HR analyst. Compare these candidates and provide a structured comparison. "
             "Return ONLY valid JSON: "
             '{"winner_id": <id>, "winner_reason": "...", "comparison": "2-3 paragraph comparison", '
             '"recommendation": "1-2 sentence final recommendation"}'),
            ("human", f"Department context: {data.department_id or 'General'}\n\n{context}")
        ])
        chain = prompt | llm | StrOutputParser()
        raw = chain.invoke({})
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        comparison = json.loads(clean)

        return {
            "success": True,
            "data": {
                "candidates": candidates_info,
                "comparison": comparison,
            }
        }
    except Exception as exc:
        # Fallback: return sorted candidates without LLM comparison
        sorted_candidates = sorted(candidates_info, key=lambda x: x["ai_score"], reverse=True)
        return {
            "success": True,
            "data": {
                "candidates": sorted_candidates,
                "comparison": {
                    "winner_id": sorted_candidates[0]["id"] if sorted_candidates else None,
                    "winner_reason": "Highest AI match score",
                    "comparison": "LLM comparison unavailable. Candidates sorted by AI score.",
                    "recommendation": f"{sorted_candidates[0]['name']} is recommended based on score." if sorted_candidates else "",
                },
            }
        }


# ── HR Assistant Chat ─────────────────────────────────────────────────────────

@router.post("/assistant/chat")
def chat_with_assistant(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Chat with the HR AI Assistant. Supports real candidate context injection."""
    # Build context: inject real DB data based on query keywords
    context_parts = []

    # Inject HR User Context
    if current_user:
        context_parts.append(
            f"HR User Profile:\n"
            f"  Name: {current_user.full_name}\n"
            f"  Email: {current_user.email}\n"
            f"  Role: {current_user.role.value if hasattr(current_user.role, 'value') else current_user.role}"
        )

    # If a specific candidate was requested, inject their data
    if data.candidate_id:
        c = candidate_repository.get_by_id(db, data.candidate_id)
        if c:
            skills = [cs.skill.name for cs in c.skills if cs.skill]
            context_parts.append(
                f"Candidate Profile:\n"
                f"  Name: {c.first_name} {c.last_name}\n"
                f"  Email: {c.email}\n"
                f"  Degree: {c.degree or 'N/A'}\n"
                f"  University: {c.university or 'N/A'}\n"
                f"  AI Score: {c.ai_score}%\n"
                f"  Skills: {', '.join(skills[:15])}\n"
                f"  Summary: {c.ai_summary or 'Not yet analyzed'}\n"
                f"  Strengths: {', '.join(c.ai_strengths or [])}\n"
                f"  Status: {c.status.value if hasattr(c.status, 'value') else c.status}\n"
                f"  Workflow: {c.workflow_stage.value if hasattr(c.workflow_stage, 'value') else c.workflow_stage}"
            )

    # If a specific department was requested, inject their data
    if data.department_id:
        dept = department_repository.get_by_id(db, data.department_id)
        if dept:
            dept_skills = [s.name for s in dept.skills] if getattr(dept, 'skills', None) else []
            context_parts.append(
                f"Department Profile:\n"
                f"  Name: {dept.name}\n"
                f"  Description: {dept.description or 'N/A'}\n"
                f"  Capacity: {dept.current_count}/{dept.capacity}\n"
                f"  Required Skills: {', '.join(dept_skills)}"
            )

    # Inject top candidates if query seems to be asking for a list
    query_lower = data.query.lower()
    if any(kw in query_lower for kw in ["best", "top", "candidates", "show me", "list"]):
        top = candidate_repository.get_all(db, skip=0, limit=5)[0]
        if top:
            context_parts.append(
                "Top 5 Candidates by AI Score:\n" +
                "\n".join(
                    f"  {i+1}. {c.first_name} {c.last_name} — Score: {c.ai_score}% — "
                    f"Skills: {', '.join([cs.skill.name for cs in c.skills if cs.skill][:5])}"
                    for i, c in enumerate(top)
                )
            )

    if data.context_data:
        context_parts.append(data.context_data)

    full_context = "\n\n".join(context_parts) if context_parts else "No specific context provided."

    try:
        from app.ai.hr_assistant import ask_hr_assistant
        response = ask_hr_assistant(data.query, full_context)
        return {"success": True, "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
