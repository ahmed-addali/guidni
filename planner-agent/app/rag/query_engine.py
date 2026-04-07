"""Query Engine — async multi-stage retrieval over Qdrant.

Pipeline stages:
1) Core dense retrieval (always on) with strict pre-filtering in Qdrant
2) Optional reranking (feature-flagged)
3) Optional hybrid retrieval (feature-flagged)
4) Tags-aware filtering/prioritization and enriched-state propagation
"""

import asyncio
import logging
from typing import Any

from llama_index.core import Settings as LlamaSettings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from pydantic import BaseModel, Field
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

from app.config import settings

logger = logging.getLogger(__name__)


class RagSearchResult(BaseModel):
    entity_id: str
    entity_type: str
    title: str
    score: float
    snippet: str = ""
    category: str | list[str] = ""
    region: str = ""
    city: str = ""
    price: int = 0
    location: str = ""
    latitude: float | None = None
    longitude: float | None = None
    coordinates: dict[str, Any] = Field(default_factory=dict)
    address: str = ""
    description: str = ""
    tags: list[str] = Field(default_factory=list)
    is_enriched: bool = False


async def _collection_name() -> str:
    return settings.RAG_QDRANT_COLLECTION or "guidni_entities"


async def _to_string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip().lower() for v in value if str(v).strip()]
    txt = str(value).strip().lower()
    if not txt:
        return []
    return [part.strip() for part in txt.split(",") if part.strip()]


async def _get_embed_model() -> Any:
    model = LlamaSettings.embed_model
    if model is not None:
        return model

    embed_model = HuggingFaceEmbedding(
        model_name=settings.RAG_EMBEDDING_MODEL,
        trust_remote_code=True,
        device="cpu",
    )
    LlamaSettings.embed_model = embed_model
    return embed_model


async def _embed_text(text: str) -> list[float]:
    model = await _get_embed_model()
    return await asyncio.to_thread(model.get_text_embedding, text)


async def _get_qdrant_client() -> AsyncQdrantClient:
    from app.rag.index_builder import get_index, load_or_build_index

    client = get_index()
    if client is None:
        client = await load_or_build_index()
    return client


async def _build_qdrant_filter(
    entity_types: list[str] | None = None,
    region: str | None = None,
    city: str | None = None,
    max_price: int | None = None,
    tags: list[str] | None = None,
) -> qmodels.Filter | None:
    must_conditions: list[qmodels.FieldCondition] = []

    if entity_types:
        normalized = [et.strip().lower() for et in entity_types if et and et.strip()]
        if normalized:
            must_conditions.append(
                qmodels.FieldCondition(
                    key="entity_type",
                    match=qmodels.MatchAny(any=normalized),
                )
            )

    location_conditions = []
    if region:
        location_conditions.append(qmodels.FieldCondition(key="region", match=qmodels.MatchText(text=region.strip())))
    if city:
        location_conditions.append(qmodels.FieldCondition(key="city", match=qmodels.MatchText(text=city.strip())))
    
    if location_conditions:
        must_conditions.append(qmodels.Filter(should=location_conditions))

    if max_price is not None:
        must_conditions.append(
            qmodels.FieldCondition(
                key="price",
                range=qmodels.Range(lte=float(max_price)),
            )
        )

    # normalized_tags = [t.strip().lower() for t in (tags or []) if t and t.strip()]
    # if normalized_tags:
    #     must_conditions.append(
    #         qmodels.FieldCondition(
    #             key="tags",
    #             match=qmodels.MatchAny(any=normalized_tags),
    #         )
    #     )

    if not must_conditions:
        return None
    return qmodels.Filter(must=must_conditions)


async def _payload_to_result(payload: dict[str, Any], score: float) -> RagSearchResult:
    description = str(payload.get("description", "") or "")
    snippet = description[:200] + "..." if len(description) > 200 else description

    return RagSearchResult(
        entity_id=str(payload.get("entity_id", "")),
        entity_type=str(payload.get("entity_type", "")),
        title=str(payload.get("title", "")),
        score=round(float(score), 4),
        snippet=snippet,
        category=payload.get("category", ""),
        region=str(payload.get("region", "") or ""),
        city=str(payload.get("city", "") or ""),
        price=int(payload.get("price", 0) or 0),
        location=str(payload.get("location", "") or ""),
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude"),
        coordinates=payload.get("coordinates", {}) or {},
        address=str(payload.get("address", "") or ""),
        description=description,
        tags=await _to_string_list(payload.get("tags", [])),
        is_enriched=bool(payload.get("is_enriched", False)),
    )


async def _rerank_results(query: str, candidates: list[RagSearchResult], top_k: int) -> list[RagSearchResult]:
    """Synchronous CPU-bound reranking logic to be offloaded to a thread."""
    if not candidates:
        return []
    query_terms = set(tok for tok in query.lower().split() if tok)

    def _rank_score(item: RagSearchResult) -> float:
        text_terms = set((item.title + " " + item.description).lower().split())
        tag_terms = set(item.tags)
        overlap = len(query_terms.intersection(text_terms))
        tag_overlap = len(query_terms.intersection(tag_terms))
        return item.score + overlap * 0.01 + tag_overlap * 0.02

    reranked = sorted(candidates, key=_rank_score, reverse=True)
    return reranked[:top_k]


async def rag_query(
    query: str,
    entity_types: list[str] | None = None,
    region: str | None = None,
    city: str | None = None,
    max_price: int | None = None,
    tags: list[str] | None = None,
    top_k: int | None = None,
) -> list[dict[str, Any]]:
    """Async multi-stage retrieval with strict pre-filtering in Qdrant."""
    logger.info(
        "RAG Query Input: query='%s', entity_types=%s, region=%s, city=%s, max_price=%s, tags=%s, top_k=%s",
        query, entity_types, region, city, max_price, tags, top_k
    )
    if top_k is None:
        top_k = settings.RAG_SIMILARITY_TOP_K

    query_filter = await _build_qdrant_filter(
        entity_types=entity_types, region=region, city=city, max_price=max_price, tags=tags
    )
    logger.debug("RAG Query Built Filter: %s", query_filter)

    logger.debug("Embedding query text...")
    query_vector = await _embed_text(query)
    client = await _get_qdrant_client()

    should_rerank = bool(settings.RAG_ENABLE_RERANKING)
    enable_hybrid = bool(settings.RAG_ENABLE_HYBRID_SEARCH)
    initial_limit = max(50, top_k) if should_rerank else top_k
    
    logger.info("RAG Executing Qdrant search (hybrid=%s, rerank=%s, limit=%s)...", enable_hybrid, should_rerank, initial_limit)

    try:
        # SOTA: Unified Qdrant Query API (No more if/else branching for standard requests)
        if enable_hybrid:
            sparse_tokens = [tok for tok in query.lower().split() if tok]
            sparse_indices = [abs(hash(tok)) % 50000 for tok in sparse_tokens]
            sparse_values = [1.0 for _ in sparse_indices]
            
            response = await client.query_points(
                collection_name=await _collection_name(),
                prefetch=[
                    qmodels.Prefetch(query=query_vector, using="dense", limit=initial_limit),
                    qmodels.Prefetch(
                        query=qmodels.SparseVector(indices=sparse_indices, values=sparse_values),
                        using="sparse",
                        limit=initial_limit,
                    ),
                ],
                query=qmodels.FusionQuery(fusion=qmodels.Fusion.RRF),
                query_filter=query_filter,
                with_payload=True,
                limit=initial_limit,
            )
        else:
            response = await client.query_points(
                collection_name=await _collection_name(),
                query=query_vector,  # FIX: Using 'query' instead of 'query_vector'
                query_filter=query_filter,
                with_payload=True,
                limit=initial_limit,
            )
        raw_points = response.points
        logger.debug("RAG Qdrant search returned %d raw points.", len(raw_points))
    except Exception as e:
        logger.error("Qdrant retrieval failed: %s", e, exc_info=True)
        raw_points = []

    candidates: list[RagSearchResult] = []
    for point in raw_points:
        if point.score is None or point.score < settings.RAG_SCORE_THRESHOLD:
            logger.debug("RAG Skipping point due to score threshold: ID=%s, Score=%s", getattr(point, "id", "Unknown"), point.score)
            continue
        payload = point.payload or {}
        candidates.append(await _payload_to_result(payload=payload, score=point.score))
        
    logger.info("RAG After score threshold filtering: %d candidates remaining.", len(candidates))

    # Architecture Fix: Offload CPU-bound intersection to a thread to unblock Async loop
    if should_rerank and candidates:
        logger.debug("RAG Reranking %d candidates...", len(candidates))
        final_results = await asyncio.to_thread(_rerank_results, query, candidates, top_k)
        logger.debug("RAG Reranking complete. %d results after reranking.", len(final_results))
    else:
        final_results = candidates[:top_k]

    logger.info("RAG Query Output: returning %d final results.", len(final_results))
    return [item.model_dump() for item in final_results]


async def rag_find_similar(
    entity_type: str,
    entity_id: str,
    top_k: int = 3,
) -> list[dict[str, Any]]:
    """Find similar entities using Qdrant's native recommend API."""
    logger.info("RAG Find Similar Input: entity_type='%s', entity_id='%s', top_k=%d", entity_type, entity_id, top_k)
    client = await _get_qdrant_client()

    query_filter = await _build_qdrant_filter(entity_types=[entity_type])
    point_id = f"{entity_type}_{entity_id}"

    try:
        points = await client.recommend(
            collection_name=await _collection_name(),
            positive=[point_id],
            query_filter=query_filter,
            limit=top_k + 1,
            with_payload=True,
            with_vectors=False,
        )
    except Exception as e:
        logger.error("Qdrant recommend failed for %s: %s", point_id, e, exc_info=True)
        return [{"error": f"Recommend failed: {str(e)}"}]

    logger.debug("RAG Recommend returned %d raw points.", len(points))
    results: list[RagSearchResult] = []
    for point in points:
        payload = point.payload or {}
        candidate_entity_id = str(payload.get("entity_id", ""))
        if candidate_entity_id == entity_id:
            continue
        score = float(point.score) if point.score is not None else 0.0
        results.append(await _payload_to_result(payload=payload, score=score))

    final_results = [item.model_dump() for item in results[:top_k]]
    logger.info("RAG Find Similar Output: returning %d final results.", len(final_results))
    return final_results
