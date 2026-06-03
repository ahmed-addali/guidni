"""
Central configuration — reads from .env via pydantic-settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────
    database_url: str = "postgresql://postgres:0000@localhost:5432/guidni_db"

    # ── Qdrant ────────────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
    qdrant_collection_prefix: str = "guidni_"

    # ── Embedding model ───────────────────────────────────────────
    bge_m3_model: str = "BAAI/bge-m3"
    embedding_batch_size: int = 32
    embedding_dimension: int = 1024

    # ── FastAPI ───────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
