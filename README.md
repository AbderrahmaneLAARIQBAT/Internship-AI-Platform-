# 🤖 Intern AI Platform

**Assistant IA pour la gestion des demandes de stage et l'affectation intelligente des stagiaires**

A production-ready, full-stack AI-powered internship management platform that intelligently matches candidates to departments using machine learning.

---

## 🏗️ Architecture

```
intern-ai-platform/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS
├── backend/           # Python FastAPI + SQLAlchemy 2.0
├── database/          # PostgreSQL init + seed SQL
├── docker-compose.yml # Full orchestration
└── Makefile           # Developer shortcuts
```

### Architecture Diagram

```
Browser ──→ Nginx (Port 3000) ──→ React SPA
                  │
                  ↓ /api proxy
           FastAPI Backend (Port 8000)
                  │
                  ├──→ PostgreSQL (Port 5432)
                  └──→ AI Services (spaCy, PyMuPDF)
```

---

## 🚀 Tech Stack

| Layer        | Technology                                   |
|-------------|----------------------------------------------|
| Frontend    | React 18, Vite, TypeScript, Tailwind CSS     |
| Backend     | Python FastAPI, Uvicorn                       |
| ORM         | SQLAlchemy 2.0                               |
| Database    | PostgreSQL 16                                |
| Auth        | JWT (access + refresh tokens), bcrypt        |
| AI/NLP      | spaCy, PyMuPDF, pdfplumber, scikit-learn     |
| State       | Zustand                                      |
| Charts      | Recharts                                     |
| HTTP        | Axios (with auto token refresh)              |
| Deploy      | Docker + Docker Compose + Nginx              |

---

## ⚡ Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose installed

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd intern-ai-platform

# Copy environment variables
cp .env.example .env
```

### 2. Start Everything

```bash
docker compose up --build
```

> ⚠️ First build takes ~5-10 minutes (downloads spaCy model, installs dependencies)

### 3. Access the Application

| Service        | URL                              |
|---------------|----------------------------------|
| 🌐 Frontend    | http://localhost:3000            |
| ⚡ Backend API  | http://localhost:8000            |
| 📖 Swagger UI  | http://localhost:8000/docs       |
| 🔄 ReDoc       | http://localhost:8000/redoc      |
| 🗄️ PostgreSQL  | localhost:5432                   |

---

## 🔑 Demo Credentials

| Role    | Email                 | Password    |
|--------|-----------------------|-------------|
| Admin  | admin@company.com     | password    |
| HR     | hr@company.com        | password    |
| Manager| manager@company.com   | password    |
| Student| student@company.com   | password    |

---

## 🌍 Environment Variables

See `.env.example` for all available variables:

```env
POSTGRES_DB=intern_ai
POSTGRES_USER=intern_admin
POSTGRES_PASSWORD=securepassword
SECRET_KEY=your-secret-key-change-this
CORS_ORIGINS=http://localhost:3000
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint                  | Description              |
|--------|--------------------------|--------------------------|
| POST   | `/api/v1/auth/register`  | Register new user        |
| POST   | `/api/v1/auth/login`     | Login, get JWT tokens    |
| POST   | `/api/v1/auth/refresh`   | Refresh access token     |
| GET    | `/api/v1/auth/me`        | Get current user profile |

### Candidates
| Method | Endpoint                              | Description           |
|--------|--------------------------------------|-----------------------|
| GET    | `/api/v1/candidates`                 | List with pagination  |
| POST   | `/api/v1/candidates`                 | Create candidate      |
| GET    | `/api/v1/candidates/{id}`            | Get candidate detail  |
| PUT    | `/api/v1/candidates/{id}`            | Update candidate      |
| POST   | `/api/v1/candidates/{id}/upload-cv`  | Upload PDF CV         |

### AI Services
| Method | Endpoint                          | Description                    |
|--------|----------------------------------|--------------------------------|
| POST   | `/api/v1/ai/analyze-cv`          | Parse CV PDF → extract info    |
| POST   | `/api/v1/ai/extract-skills`      | Extract skills from text       |
| POST   | `/api/v1/ai/recommend-department`| Recommend best department      |
| POST   | `/api/v1/ai/rank-candidates`     | Rank candidates for department |

### Analytics
| Method | Endpoint                                | Description              |
|--------|----------------------------------------|--------------------------|
| GET    | `/api/v1/analytics/dashboard`          | Summary KPIs             |
| GET    | `/api/v1/analytics/candidates-by-status` | Status distribution    |
| GET    | `/api/v1/analytics/top-skills`         | Most common skills       |
| GET    | `/api/v1/analytics/departments-capacity`| Capacity utilization    |

---

## 🤖 AI Features

### CV Parser
- Extracts text from PDF using **PyMuPDF** (with pdfplumber fallback)
- Detects: name, email, phone, education, skills

### Skill Extractor
- Multi-word phrase matching (highest priority)
- spaCy tokenization for precise matching
- Fuzzy similarity matching (difflib)
- Dictionary of **40+ technical skills**

### Matching Engine
```python
score = (
    skill_match_ratio * 0.70 +
    education_match  * 0.20 +
    experience_bonus * 0.10
)
# Result: 0–100%
```

---

## 🛠️ Developer Commands

```bash
make up          # Start all services (detached)
make build       # Rebuild and start
make down        # Stop services
make logs        # Follow all logs
make logs-api    # Follow backend logs
make shell-api   # Shell into backend
make shell-db    # Open psql
make clean       # Remove everything
```

---

## 🏭 Production Deployment

1. Update `.env` with strong secrets:
   ```env
   SECRET_KEY=<minimum-32-char-random-string>
   POSTGRES_PASSWORD=<strong-password>
   CORS_ORIGINS=https://your-domain.com
   ```

2. Use production Docker Compose overrides:
   - Remove `--reload` from uvicorn CMD
   - Set `--workers 4` for Gunicorn
   - Enable SSL/TLS via Nginx or reverse proxy

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| Landing | Marketing hero page |
| Dashboard | KPI cards + charts |
| Candidates | Card grid with AI scores |
| Analytics | Recharts area/bar/pie charts |
| AI Analysis | CV parsing + department ranking |

---

## 👨‍💻 Built For

PFE Project — University Final Year Engineering Project
**"Assistant IA pour la gestion des demandes de stage et l'affectation intelligente des stagiaires"**
