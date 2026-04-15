"""Configuration — reads directly from .env via os.environ.

No secrets are stored in this file. All values come from the .env file.
This module provides a simple 'settings' object that reads os.environ
with the same attribute-access API used throughout the codebase.
"""

import os
from dotenv import load_dotenv

# Load .env file into os.environ
load_dotenv()


class _EnvSettings:
    """Lightweight wrapper around os.environ with attribute access.
    
    Usage: settings.GROQ_API_KEY  →  os.environ.get("GROQ_API_KEY", "")
    No default values for secrets — they MUST be in .env.
    """

    def __getattr__(self, name: str):
        """Read from environment. Non-sensitive fields have safe defaults."""
        defaults = {
            # Non-sensitive defaults only
            "LLM_PROVIDER": "ollama",
            "OLLAMA_BASE_URL": "http://localhost:11434",
            "OLLAMA_MODEL": "qwen2.5:7b",
            "GROQ_MODEL": "llama-3.3-70b-versatile",
            "GEMINI_MODEL": "gemini-2.0-flash",
            "DEFAULT_REGION": "Djerba",
            "MAX_AGENT_ITERATIONS": "15",
            "CONVERSATION_SUMMARY_THRESHOLD": "15",
            "RAG_STORAGE_DIR": "./rag_storage",
            "RAG_EMBEDDING_MODEL": "BAAI/bge-m3",
            "RAG_SIMILARITY_TOP_K": "5",
            "RAG_SCORE_THRESHOLD": "0.1",
            "RAG_QDRANT_URL": "http://localhost:6333",
            "RAG_QDRANT_COLLECTION": "guidni_entities",
            "RAG_QDRANT_TIMEOUT": "10",
            "RAG_ENABLE_RERANKING": "false",
            "RAG_ENABLE_HYBRID_SEARCH": "false",
            "VECTOR_ENGINE": "pgvector",
        }
        value = os.environ.get(name, defaults.get(name, ""))

        # Auto-cast numeric types
        if name in ("MAX_AGENT_ITERATIONS", "CONVERSATION_SUMMARY_THRESHOLD", "RAG_SIMILARITY_TOP_K"):
            return int(value) if value else 0
        if name in ("RAG_SCORE_THRESHOLD",):
            return float(value) if value else 0.0
        if name in ("RAG_ENABLE_RERANKING", "RAG_ENABLE_HYBRID_SEARCH"):
            return str(value).strip().lower() in ("1", "true", "yes", "on")

        return value


settings = _EnvSettings()
