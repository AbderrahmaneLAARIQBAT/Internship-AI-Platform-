# CV Extra

Standalone CV extraction module that can be copied into another Python
project. It does not import the Intern AI Platform backend or use its database.

## What it extracts

- Personal details: name, email, phone, date of birth
- Professional links: LinkedIn and GitHub
- Education history
- Work experience
- Projects and technologies
- Certifications
- Languages
- Skills
- `raw_text` extracted locally from PDF or DOCX

## Setup

```bash
cd "cv extra"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set `CV_EXTRA_API_KEY` in `.env`. Never commit the real `.env` file.

## Use from Python

```python
from dotenv import load_dotenv
from cv_parser import parse_cv

load_dotenv()
result = parse_cv("candidate_cv.pdf")

if "error" in result:
    print(result["error"])
else:
    print(result["first_name"])
    print(result["skills"])
    print(result["experience"])
```

The accepted file types are `.pdf`, `.docx`, `.jpg`, `.jpeg`, and `.png`.
PDF and DOCX text is extracted locally first. Scanned PDFs and images are
sent as images to the configured vision-capable model.
