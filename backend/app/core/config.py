from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    POSTGRES_DB: str = "intern_ai"
    POSTGRES_USER: str = "intern_admin"
    POSTGRES_PASSWORD: str = "securepassword"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Upload
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # AI provider
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    LLM_MODEL_NAME: str = ""
    NVIDIA_API_KEY: str = ""
    LLM_BASE_URL: str = ""

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
