"""RAG Module — LlamaIndex-based semantic vector search for Guidni data.

Provides semantic search over Activity, Stay, Yummy, and Attraction entities
using BAAI/bge-m3 embeddings with incremental auto-indexing.
"""

from app.rag.query_engine import rag_query
from app.rag.index_builder import build_full_index, upsert_entity, delete_entity, load_or_build_index
from app.rag.settings import initialize_rag_settings

__all__ = [
    "rag_query",
    "build_full_index",
    "upsert_entity",
    "delete_entity",
    "load_or_build_index",
    "initialize_rag_settings",
]
