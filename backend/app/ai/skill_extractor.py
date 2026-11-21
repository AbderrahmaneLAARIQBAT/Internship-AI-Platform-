"""
Skill Extractor — Identifies technical skills from free text using spaCy tokenization
and fuzzy matching against a predefined skill dictionary.
"""
from __future__ import annotations

import re
import logging
from typing import List, Set

logger = logging.getLogger(__name__)

# ---- Skill Dictionary --------------------------------------------------------

TECH_SKILLS: List[str] = [
    # Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB",
    # Web Frameworks
    "FastAPI", "Django", "Flask", "React", "Vue.js", "Angular", "Next.js",
    "Node.js", "Express.js", "Spring Boot", "Laravel",
    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Cassandra",
    "Elasticsearch", "Oracle", "SQL Server",
    # DevOps & Cloud
    "Docker", "Kubernetes", "Git", "Linux", "AWS", "Azure", "GCP",
    "CI/CD", "Jenkins", "GitHub Actions", "Terraform", "Ansible",
    # Data Science & AI
    "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch",
    "scikit-learn", "Pandas", "NumPy", "Keras", "OpenCV", "Spark",
    # BI & Analytics
    "Power BI", "Tableau", "Excel", "SSIS", "Data Warehousing",
    # Security
    "Cybersecurity", "Penetration Testing", "Network Administration",
    "Wireshark", "Metasploit",
    # Other
    "REST API", "GraphQL", "Microservices", "Agile", "Scrum", "Jira",
    "SQL", "HTML", "CSS", "Bash",
]

# Build lowercase lookup for fast matching
_SKILL_LOWER: dict = {s.lower(): s for s in TECH_SKILLS}
# Multi-word skill tokens
_MULTI_WORD: List[tuple] = [
    (s.lower(), s) for s in TECH_SKILLS if " " in s or "." in s
]


def _normalize(text: str) -> str:
    return text.lower().strip()


def _fuzzy_match(token: str, threshold: float = 0.82) -> List[str]:
    """Simple character-level similarity for near-matches."""
    matched = []
    for skill_lower, skill_orig in _SKILL_LOWER.items():
        if token == skill_lower:
            matched.append(skill_orig)
            continue
        # Levenshtein-like ratio using difflib
        from difflib import SequenceMatcher
        ratio = SequenceMatcher(None, token, skill_lower).ratio()
        if ratio >= threshold and len(token) >= 4:
            matched.append(skill_orig)
    return matched


def extract_skills(text: str) -> List[str]:
    """
    Extract skills from raw text using:
    1. Multi-word phrase matching (highest priority)
    2. Single-token exact matching
    3. Fuzzy similarity matching
    """
    found: Set[str] = set()
    text_lower = text.lower()

    # 1. Multi-word phrase matching
    for phrase_lower, phrase_orig in _MULTI_WORD:
        if phrase_lower in text_lower:
            found.add(phrase_orig)

    # 2. Tokenize and match
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            nlp = None

        if nlp:
            doc = nlp(text[:5000])
            for token in doc:
                t = _normalize(token.text)
                if t in _SKILL_LOWER:
                    found.add(_SKILL_LOWER[t])
        else:
            raise ImportError("spaCy model not available")

    except Exception:
        # Fallback: simple word tokenization
        tokens = re.findall(r"\b\w[\w.+#]*\b", text_lower)
        for t in tokens:
            if t in _SKILL_LOWER:
                found.add(_SKILL_LOWER[t])

    # 3. Additional fuzzy pass on words not yet matched
    words = re.findall(r"\b\w{4,}\b", text_lower)
    for word in words:
        if not any(word == s.lower() for s in found):
            matches = _fuzzy_match(word, threshold=0.88)
            found.update(matches)

    return sorted(found)
