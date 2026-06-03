"""
BGE-M3 embedding service — singleton that loads the model once
and provides batch + single-query embedding methods.

BGE-M3 produces 1024-dimensional dense vectors and supports
multilingual text (English + Arabic — perfect for Guidni).
"""

import logging
from threading import Lock

from FlagEmbedding import BGEM3FlagModel

from config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Thread-safe singleton for BGE-M3 embeddings."""

    _instance: "EmbeddingService | None" = None
    _lock = Lock()

    def __init__(self) -> None:
        settings = get_settings()
        logger.info("Loading BGE-M3 model: %s", settings.bge_m3_model)
        self._model = BGEM3FlagModel(settings.bge_m3_model, use_fp16=True)
        self._batch_size = settings.embedding_batch_size
        self._dim = settings.embedding_dimension
        logger.info("BGE-M3 ready — dimension: %d", self._dim)

    # ── Singleton accessor ────────────────────────────────────
    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    # ── Public API ────────────────────────────────────────────
    @property
    def dimension(self) -> int:
        return self._dim

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """
        Batch-embed a list of texts into 1024-dim dense vectors.
        Handles batching internally for large lists.
        """
        if not texts:
            return []

        all_vectors: list[list[float]] = []

        for i in range(0, len(texts), self._batch_size):
            batch = texts[i : i + self._batch_size]
            result = self._model.encode(
                batch,
                batch_size=len(batch),
                max_length=512,
                return_dense=True,
                return_sparse=False,
                return_colbert_vecs=False,
            )
            dense = result["dense_vecs"]
            # Convert numpy arrays to plain Python lists
            for vec in dense:
                all_vectors.append(vec.tolist())

        return all_vectors

    def embed_query(self, query: str) -> list[float]:
        """Embed a single search query → 1024-dim vector."""
        vectors = self.embed_texts([query])
        return vectors[0]

    def embed_texts_with_ids(
        self, items: list[tuple[str, str]]
    ) -> list[tuple[str, list[float]]]:
        """
        Embed (id, text) pairs. Returns (id, vector) pairs.
        Useful for ingestion where you need to track IDs.
        """
        ids = [item[0] for item in items]
        texts = [item[1] for item in items]
        vectors = self.embed_texts(texts)
        return list(zip(ids, vectors))
