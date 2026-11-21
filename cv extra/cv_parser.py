"""Standalone CV parser for PDF, DOCX, and image files.

The parser extracts text locally and optionally sends the extracted content
to a vision-capable or text-capable chat model for structured data extraction.
It has no dependency on the main application's database or backend package.
"""
from __future__ import annotations

import base64
import json
import logging
import os
from pathlib import Path
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class ChatModel(Protocol):
    def invoke(self, messages: list[Any]) -> Any:
        ...


def _extract_pdf_text(filepath: Path) -> str:
    try:
        import fitz

        with fitz.open(filepath) as document:
            return "\n".join(page.get_text("text") for page in document)
    except Exception as exc:
        logger.warning("PDF text extraction failed: %s", exc)
        return ""


def _pdf_images(filepath: Path, max_pages: int = 2) -> list[str]:
    images: list[str] = []
    try:
        import fitz

        with fitz.open(filepath) as document:
            for page_index in range(min(len(document), max_pages)):
                page = document[page_index]
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                images.append(base64.b64encode(pixmap.tobytes("jpeg")).decode("ascii"))
    except Exception as exc:
        logger.warning("PDF image rendering failed: %s", exc)
    return images


def _extract_docx_text(filepath: Path) -> str:
    try:
        import docx

        document = docx.Document(filepath)
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    except Exception as exc:
        logger.warning("DOCX text extraction failed: %s", exc)
        return ""


def _image_base64(filepath: Path) -> str:
    return base64.b64encode(filepath.read_bytes()).decode("ascii")


def _prompt() -> str:
    return """Extract the candidate information from this CV.
Understand the original language but do not translate values.
Do not guess or invent missing information. Use null or [] when unavailable.
Return only valid JSON with exactly these keys:
{
  "first_name": null,
  "last_name": null,
  "email": null,
  "phone": null,
  "linkedin_url": null,
  "github_url": null,
  "date_of_birth": null,
  "education_history": [
    {"university": null, "degree": null, "graduation_year": null}
  ],
  "experience": [
    {"company": null, "role": null, "start_date": null, "end_date": null, "description": null}
  ],
  "projects": [
    {"name": null, "description": null, "technologies": []}
  ],
  "certifications": [],
  "languages": [],
  "skills": []
}"""


def _clean_response(content: Any) -> str:
    if isinstance(content, list):
        content = "".join(
            item.get("text", "") if isinstance(item, dict) else str(item)
            for item in content
        )
    text = str(content).strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()


def _empty_result(raw_text: str = "") -> dict[str, Any]:
    return {
        "first_name": None,
        "last_name": None,
        "email": None,
        "phone": None,
        "linkedin_url": None,
        "github_url": None,
        "date_of_birth": None,
        "education_history": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "languages": [],
        "skills": [],
        "raw_text": raw_text,
    }


def _normalize(data: dict[str, Any], raw_text: str) -> dict[str, Any]:
    result = _empty_result(raw_text)
    result.update({key: data.get(key) for key in result if key in data})
    for key in (
        "education_history",
        "experience",
        "projects",
        "certifications",
        "languages",
        "skills",
    ):
        if not isinstance(result[key], list):
            result[key] = []

    education = result["education_history"]
    primary = education[0] if education and isinstance(education[0], dict) else {}
    result["university"] = primary.get("university")
    result["degree"] = primary.get("degree")
    result["graduation_year"] = primary.get("graduation_year")
    return result


def create_llm_from_env() -> ChatModel:
    """Create an LLM using CV_EXTRA_PROVIDER and related environment variables."""
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_openai import ChatOpenAI

    provider = os.getenv("CV_EXTRA_PROVIDER", "gemini").lower()
    api_key = os.getenv("CV_EXTRA_API_KEY") or os.getenv("GEMINI_API_KEY", "")
    model = os.getenv("CV_EXTRA_MODEL")
    base_url = os.getenv("CV_EXTRA_BASE_URL")

    if provider in {"openai", "custom"}:
        return ChatOpenAI(
            model=model or ("gpt-4o-mini" if provider == "openai" else "local-model"),
            api_key=api_key or "local-model",
            base_url=base_url if provider == "custom" else None,
            temperature=0.2,
        )
    return ChatGoogleGenerativeAI(
        model=model or "gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0.2,
    )


def parse_cv(filepath: str | os.PathLike[str], llm: ChatModel | None = None) -> dict[str, Any]:
    """Parse a CV and return structured data plus the locally extracted raw text."""
    path = Path(filepath)
    if not path.is_file():
        return {"error": f"File not found: {path}"}

    extension = path.suffix.lower()
    raw_text = ""
    messages: list[Any]

    try:
        from langchain_core.messages import HumanMessage
    except ImportError as exc:
        return {"error": f"Missing dependency: {exc}"}

    if extension == ".pdf":
        raw_text = _extract_pdf_text(path)
        if len(raw_text.strip()) >= 100:
            messages = [HumanMessage(content=f"{_prompt()}\n\nCV text:\n{raw_text[:20000]}")]
        else:
            content: list[dict[str, Any]] = [{"type": "text", "text": _prompt()}]
            content.extend(
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}}
                for image in _pdf_images(path)
            )
            messages = [HumanMessage(content=content)]
    elif extension == ".docx":
        raw_text = _extract_docx_text(path)
        messages = [HumanMessage(content=f"{_prompt()}\n\nCV text:\n{raw_text[:20000]}")]
    elif extension in {".jpg", ".jpeg", ".png"}:
        mime = "image/png" if extension == ".png" else "image/jpeg"
        messages = [
            HumanMessage(
                content=[
                    {"type": "text", "text": _prompt()},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{_image_base64(path)}"}},
                ]
            )
        ]
    else:
        return {"error": f"Unsupported file type: {extension}"}

    try:
        response = (llm or create_llm_from_env()).invoke(messages)
        data = json.loads(_clean_response(response.content))
        return _normalize(data, raw_text)
    except Exception as exc:
        logger.error("CV structured extraction failed: %s", exc)
        result = _empty_result(raw_text)
        result["error"] = str(exc)
        return result
