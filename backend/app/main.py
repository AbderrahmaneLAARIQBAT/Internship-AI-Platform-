import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.router import api_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Intern AI Platform starting up...")
    # Create upload directories
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(f"{settings.UPLOAD_DIR}/cv", exist_ok=True)
    os.makedirs(f"{settings.UPLOAD_DIR}/letters", exist_ok=True)
    yield
    logger.info("👋 Intern AI Platform shutting down...")


app = FastAPI(
    title="Intern AI Platform API",
    description=(
        "**Assistant IA pour la gestion des demandes de stage "
        "et l'affectation intelligente des stagiaires**\n\n"
        "A production-ready FastAPI backend with JWT authentication, "
        "AI-powered CV analysis, skill extraction, and intelligent matching."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Logging Middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} [{duration}ms]"
    )
    return response


# ── Global Exception Handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error", "detail": str(exc)},
    )


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "Intern AI Platform",
        "version": "1.0.0",
    }


@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to Intern AI Platform API",
        "docs": "/docs",
        "health": "/health",
    }


# ── Include API Router ─────────────────────────────────────────────────────────
app.include_router(api_router)

# ── Serve Static Uploads ───────────────────────────────────────────────────────
app.mount("/api/v1/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
