"""
CV Parser — Extracts structured text from various formats and uses LLM for parsing.
"""
from __future__ import annotations

import logging
import base64
from pathlib import Path
from typing import Dict, List, Any, Optional
import json

logger = logging.getLogger(__name__)


def _content_to_text(content: Any) -> str:
    """Convert provider text or nested content blocks to plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(_content_to_text(item) for item in content)
    if isinstance(content, dict):
        if isinstance(content.get("text"), (str, list, dict)):
            return _content_to_text(content["text"])
        if isinstance(content.get("content"), (str, list, dict)):
            return _content_to_text(content["content"])
    return str(content)


def _parse_json_response(content: Any) -> Dict[str, Any]:
    text = _content_to_text(content).strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    try:
        parsed = json.loads(text.strip())
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start < 0 or end <= start:
            raise
        parsed = json.loads(text[start:end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("CV response must be a JSON object")
    return parsed


def _as_list(value: Any) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return [line.strip() for line in value.replace(";", "\n").splitlines() if line.strip()]
    return []


def _first(data: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if data.get(key) is not None:
            return data[key]
    return default

def _extract_text_pymupdf(filepath: str) -> str:
    """Extract raw text from a PDF using PyMuPDF (fitz)."""
    try:
        import fitz
        doc = fitz.open(filepath)
        text = "\n".join(page.get_text("text") for page in doc)
        doc.close()
        return text
    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed: {e}")
        return ""

def _get_pdf_images_base64(filepath: str, max_pages: int = 2) -> List[str]:
    """Render PDF pages to base64 JPEG images (for scanned PDFs)."""
    images = []
    try:
        import fitz
        doc = fitz.open(filepath)
        for i in range(min(len(doc), max_pages)):
            page = doc[i]
            # render at 2x resolution
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_data = pix.tobytes("jpeg")
            images.append(base64.b64encode(img_data).decode('utf-8'))
        doc.close()
    except Exception as e:
        logger.warning(f"Failed to render PDF to images: {e}")
    return images

def _extract_text_docx(filepath: str) -> str:
    """Extract text from DOCX."""
    try:
        import docx
        doc = docx.Document(filepath)
        return "\n".join(para.text for para in doc.paragraphs)
    except Exception as e:
        logger.warning(f"DOCX extraction failed: {e}")
        return ""

def _get_image_base64(filepath: str) -> str:
    """Read image file and encode to base64."""
    with open(filepath, "rb") as f:
        return base64.b64encode(f.read()).decode('utf-8')

def parse_cv(filepath: str) -> Dict[str, Any]:
    """
    Parse a CV and return structured data mapped directly to form fields.
    """
    if not Path(filepath).exists():
        logger.error(f"CV file not found: {filepath}")
        return {"error": "File not found"}
        
    ext = Path(filepath).suffix.lower()
    
    # 1. Prepare messages for LLM
    from langchain_core.messages import HumanMessage
    
    messages = []
    text = ""
    prompt_text = (
        "You are an expert HR assistant. Your task is to extract information from this CV "
        "and map it exactly to the requested JSON schema. The CV might be in any language "
        "(English, French, Arabic, Spanish, German, etc.). "
        "Do NOT translate the information, just understand it and extract the corresponding values. "
        "If a specific piece of information is NOT present in the CV, leave the field empty (or null). "
        "DO NOT guess or invent information.\n\n"
        "Return ONLY a valid JSON object with these exact keys:\n"
        "{\n"
        '  "first_name": "...",\n'
        '  "last_name": "...",\n'
        '  "email": "...",\n'
        '  "phone": "...",\n'
        '  "linkedin_url": "...",\n'
        '  "github_url": "...",\n'
        '  "date_of_birth": "...",\n'
        '  "education_history": [\n'
        '    {\n'
        '      "university": "...",\n'
        '      "degree": "...",\n'
        '      "graduation_year": 2023\n'
        '    }\n'
        '  ],\n'
        '  "work_experience": [\n'
        '    {\n'
        '      "company": "...",\n'
        '      "job_title": "...",\n'
        '      "start_date": "...",\n'
        '      "end_date": "...",\n'
        '      "description": "..."\n'
        '    }\n'
        '  ],\n'
        '  "certifications": ["..."],\n'
        '  "languages": [],\n'
        '  "skills": ["...", "..."]\n'
        "}\n\n"
        "Here is the CV content:"
    )
    
    if ext == ".pdf":
        text = _extract_text_pymupdf(filepath)
        # If very little text, assume it's a scanned PDF
        if len(text.strip()) < 100:
            b64_images = _get_pdf_images_base64(filepath)
            content = [{"type": "text", "text": prompt_text}]
            for b64 in b64_images:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
                })
            messages.append(HumanMessage(content=content))
        else:
            messages.append(HumanMessage(content=f"{prompt_text}\n\n{text[:6000]}"))
            
    elif ext in [".jpg", ".jpeg", ".png"]:
        b64 = _get_image_base64(filepath)
        mime_type = f"image/{'jpeg' if ext in ['.jpg', '.jpeg'] else 'png'}"
        messages.append(HumanMessage(content=[
            {"type": "text", "text": prompt_text},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}}
        ]))
        
    elif ext == ".docx":
        text = _extract_text_docx(filepath)
        messages.append(HumanMessage(content=f"{prompt_text}\n\n{text[:6000]}"))
    else:
        return {"error": f"Unsupported file type: {ext}"}

    # 2. Call LLM
    try:
        from app.ai.llm_provider import get_llm_provider
        llm = get_llm_provider()
        response = llm.invoke(messages)
        
        data = _parse_json_response(response.content)
        
        # Normalize fields
        education_history = _as_list(_first(
            data, "education_history", "educationHistory", "education", default=[]
        ))
        work_experience = _as_list(_first(
            data, "work_experience", "workExperience", "experience", "experiences",
            "jobs", default=[]
        ))
        work_experience = [
            {
                **item,
                "job_title": _first(item, "job_title", "jobTitle", "title", "role", default=""),
            }
            if isinstance(item, dict) else {"description": str(item), "job_title": ""}
            for item in work_experience
        ]
        certifications = _as_list(_first(
            data, "certifications", "certificates", "certificates_and_training", default=[]
        ))
        languages = _as_list(_first(data, "languages", "language", default=[]))
        skills = _as_list(_first(data, "skills", "technical_skills", "competencies", default=[]))
        
        primary_edu = education_history[0] if education_history else {}
        if not isinstance(primary_edu, dict):
            primary_edu = {}

        return {
            "first_name": _first(data, "first_name", "firstName"),
            "last_name": _first(data, "last_name", "lastName"),
            "email": data.get("email"),
            "phone": data.get("phone", data.get("telephone")),
            "linkedin_url": _first(data, "linkedin_url", "linkedin"),
            "github_url": _first(data, "github_url", "github"),
            "date_of_birth": _first(data, "date_of_birth", "dateOfBirth"),
            "education_history": education_history,
            "university": _first(primary_edu, "university", "institution", "school") or data.get("university"),
            "degree": _first(primary_edu, "degree", "diploma") or data.get("degree"),
            "graduation_year": _first(primary_edu, "graduation_year", "graduationYear") or data.get("graduation_year"),
            "work_experience": work_experience,
            "certifications": certifications,
            "languages": languages,
            "skills": skills,
            "raw_text": text if ext in [".pdf", ".docx"] else "",
        }
    except Exception as e:
        logger.error(f"LLM extraction failed: {e}")
        # Return empty template on failure to not break the form
        return {
            "first_name": None, "last_name": None, "email": None,
            "phone": None, "linkedin_url": None, "github_url": None, "date_of_birth": None,
            "education_history": [], "university": None, "degree": None,
            "graduation_year": None, "work_experience": [], "certifications": [],
            "languages": [], "skills": [], "raw_text": "", "error": str(e)
        }
