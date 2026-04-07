"""RAG Settings — configure LlamaIndex embedding model and global settings.

Uses BAAI/bge-m3 for multilingual semantic embeddings (FR/EN/AR).
LLM is disabled for retrieval — the LangGraph agent handles all reasoning.
"""

import logging
from llama_index.core import Settings as LlamaSettings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from app.config import settings

logger = logging.getLogger(__name__)

_initialized = False


def initialize_rag_settings() -> None:
    """Initialize LlamaIndex global settings (called once at startup)."""
    global _initialized
    if _initialized:
        return

    logger.info("Initializing RAG settings with model: %s", settings.RAG_EMBEDDING_MODEL)

    # Configure embedding model — bge-m3 supports multilingual (FR/EN/AR)
    embed_model = HuggingFaceEmbedding(
        model_name=settings.RAG_EMBEDDING_MODEL,
        trust_remote_code=True,
        device="cpu",
    )
    LlamaSettings.embed_model = embed_model

    # Chunk settings for entity descriptions
    LlamaSettings.chunk_size = 512
    LlamaSettings.chunk_overlap = 50

    # Disable LLM — we only use embeddings for retrieval
    LlamaSettings.llm = None

    _initialized = True
    logger.info("RAG settings initialized successfully")
