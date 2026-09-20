from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "VisualSearch Memory"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/data/storage/visualsearch.db"

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_STORAGE_PATH: str = str(BASE_DIR / "data" / "qdrant_storage")
    QDRANT_COLLECTION_NAME: str = "visual_memory"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_CELERY: bool = False

    # Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_TIMEOUT_SECONDS: int = 15

    # Storage
    STORAGE_PATH: str = str(BASE_DIR / "data" / "storage")
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp", "gif"]

    # Embeddings
    EMBEDDING_MODEL: str = "ViT-B-32"
    EMBEDDING_PRETRAINED: str = "laion2b_s34b_b79k"
    EMBEDDING_DIMENSION: int = 512

    # Weights
    DEFAULT_SEMANTIC_WEIGHT: float = 0.6
    DEFAULT_KEYWORD_WEIGHT: float = 0.3
    DEFAULT_METADATA_WEIGHT: float = 0.1

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        elif isinstance(v, list):
            return v
        return ["*"]

settings = Settings()

# Ensure directories exist
Path(settings.STORAGE_PATH).mkdir(parents=True, exist_ok=True)
Path(settings.QDRANT_STORAGE_PATH).mkdir(parents=True, exist_ok=True)
