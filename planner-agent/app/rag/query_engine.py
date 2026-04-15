"""Query Engine — async router for Qdrant and pgvector retrieval.

Pipeline stages:
1) Shared query embedding
2) Router dispatch by settings.VECTOR_ENGINE
3) Engine-specific retrieval (Qdrant API or pgvector SQL)
4) Optional reranking and tags-aware post-filtering
"""

import asyncio
import logging
from typing import Any

from llama_index.core import Settings as LlamaSettings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from pydantic import BaseModel, Field
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)


_PGVECTOR_ENTITY_CONFIG: dict[str, dict[str, str]] = {
    "activity": {
        "table": "Activity",
        "title_expr": '"title"',
        "description_expr": '"description"',
        "category_expr": '"category"',
        "region_expr": '"region"',
        "city_expr": '"city"',
        "price_expr": '"price"',
        "location_expr": '"location"',
        "address_expr": '"address"',
        "latitude_expr": "NULL::double precision",
        "longitude_expr": "NULL::double precision",
        "coordinates_expr": "NULL::jsonb",
        "tags_expr": 'COALESCE("tags", ARRAY[]::text[])',
    },
    "stay": {
        "table": "Stay",
        "title_expr": '"title"',
        "description_expr": '"description"',
        "category_expr": '"category"',
        "region_expr": '"region"',
        "city_expr": '"city"',
        "price_expr": '"price"',
        "location_expr": '"location"',
        "address_expr": '"address"',
        "latitude_expr": '"latitude"',
        "longitude_expr": '"longitude"',
        "coordinates_expr": "NULL::jsonb",
        "tags_expr": "ARRAY_REMOVE(ARRAY[COALESCE(\"propertyType\", ''), COALESCE(\"category\", '')], '')",
    },
    "restaurant": {
        "table": "Restaurant",
        "title_expr": '"name"',
        "description_expr": '"description"',
        "category_expr": '"category"',
        "region_expr": '"city"',
        "city_expr": '"city"',
        "price_expr": 'COALESCE((SELECT MIN("price") FROM "RestaurantMenu" WHERE "RestaurantMenu"."restaurantId" = "Restaurant"."id"), 0)',
        "location_expr": '"location"',
        "address_expr": '"address"',
        "latitude_expr": "NULL::double precision",
        "longitude_expr": "NULL::double precision",
        "coordinates_expr": "NULL::jsonb",
        "tags_expr": (
            "COALESCE(\"foodTypes\", ARRAY[]::text[]) || "
            "COALESCE(\"dietTypes\", ARRAY[]::text[]) || "
            "COALESCE(\"attributes\", ARRAY[]::text[])"
        ),
    },
    "attraction": {
        "table": "Attraction",
        "title_expr": '"title"',
        "description_expr": '"description"',
        "category_expr": '"category"',
        "region_expr": '"location"',
        "city_expr": '"location"',
        "price_expr": 'COALESCE("feeAmount", 0)',
        "location_expr": '"location"',
        "address_expr": "''",
        "latitude_expr": "NULL::double precision",
        "longitude_expr": "NULL::double precision",
        "coordinates_expr": 'COALESCE("coordinates", \'{}\'::jsonb)',
        "tags_expr": "ARRAY_REMOVE(ARRAY[COALESCE(\"category\", '')], '')",
    },
}


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


def _rerank_results(query: str, candidates: list[RagSearchResult], top_k: int) -> list[RagSearchResult]:
    """CPU-bound reranking logic offloaded to a thread by the caller."""
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


def _normalize_entity_types(entity_types: list[str] | None) -> list[str]:
    if not entity_types:
        return list(_PGVECTOR_ENTITY_CONFIG.keys())

    normalized: list[str] = []
    seen: set[str] = set()
    for raw in entity_types:
        key = str(raw or "").strip().lower()
        if key and key in _PGVECTOR_ENTITY_CONFIG and key not in seen:
            seen.add(key)
            normalized.append(key)
    return normalized


def _to_pgvector_literal(query_vector: list[float]) -> str:
    return "[" + ",".join(f"{float(v):.8f}" for v in query_vector) + "]"


async def qdrant_search(
    query: str,
    query_vector: list[float],
    entity_types: list[str] | None = None,
    region: str | None = None,
    city: str | None = None,
    max_price: int | None = None,
    tags: list[str] | None = None,
    top_k: int | None = None,
) -> list[RagSearchResult]:
    if top_k is None:
        top_k = settings.RAG_SIMILARITY_TOP_K

    query_filter = await _build_qdrant_filter(
        entity_types=entity_types,
        region=region,
        city=city,
        max_price=max_price,
        tags=tags,
    )
    logger.debug("RAG Query Built Filter: %s", query_filter)

    client = await _get_qdrant_client()
    should_rerank = bool(settings.RAG_ENABLE_RERANKING)
    enable_hybrid = bool(settings.RAG_ENABLE_HYBRID_SEARCH)
    initial_limit = max(50, top_k) if should_rerank else top_k

    logger.info(
        "RAG Executing Qdrant search (hybrid=%s, rerank=%s, limit=%s)...",
        enable_hybrid,
        should_rerank,
        initial_limit,
    )

    try:
        # Unified Query API for dense-only and hybrid search paths.
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
                query=query_vector,
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
            logger.debug(
                "RAG Skipping point due to score threshold: ID=%s, Score=%s",
                getattr(point, "id", "Unknown"),
                point.score,
            )
            continue
        payload = point.payload or {}
        candidates.append(await _payload_to_result(payload=payload, score=point.score))

    logger.info("RAG After score threshold filtering: %d candidates remaining.", len(candidates))

    if should_rerank and candidates:
        logger.debug("RAG Reranking %d candidates...", len(candidates))
        final_results = await asyncio.to_thread(_rerank_results, query, candidates, top_k)
        logger.debug("RAG Reranking complete. %d results after reranking.", len(final_results))
    else:
        final_results = candidates[:top_k]

    return final_results


async def pgvector_search(
    session: AsyncSession,
    query_vector: list[float],
    entity_types: list[str] | None = None,
    region: str | None = None,
    city: str | None = None,
    max_price: int | None = None,
    tags: list[str] | None = None,
    top_k: int = 5,
) -> list[RagSearchResult]:
    requested_types = _normalize_entity_types(entity_types)
    if not requested_types:
        logger.warning("pgvector search requested unsupported entity types: %s", entity_types)
        return []

    query_embedding = _to_pgvector_literal(query_vector)
    normalized_tags = sorted({str(tag).strip().lower() for tag in (tags or []) if str(tag).strip()})

    per_table_top_k = max(1, int(top_k))
    normalized_city = city.strip() if city and city.strip() else None
    normalized_region = region.strip() if region and region.strip() else None
    normalized_max_price = int(max_price) if max_price is not None else None

    all_candidates: list[RagSearchResult] = []
    for entity_type in requested_types:
        cfg = _PGVECTOR_ENTITY_CONFIG[entity_type]
        normalized_item_tags_expr = (
            "ARRAY("
            f"SELECT LOWER(BTRIM(tag)) FROM UNNEST(COALESCE({cfg['tags_expr']}, ARRAY[]::text[])) AS tag "
            "WHERE tag IS NOT NULL AND BTRIM(tag) <> ''"
            ")"
        )

        async def _execute_sql(enforce_tags: bool) -> list[RagSearchResult]:
            tag_clause = ""
            params: dict[str, Any] = {
                "entity_type": entity_type,
                "embedding": query_embedding,
                "city": normalized_city,
                "region": normalized_region,
                "max_price": normalized_max_price,
                "top_k": per_table_top_k,
            }
            if enforce_tags and normalized_tags:
                tag_clause = f"\n              AND ({normalized_item_tags_expr} && CAST(:tags AS text[]))"
                params["tags"] = normalized_tags

            sql = text(
                f"""
                SELECT
                    CAST("id" AS text) AS entity_id,
                    :entity_type AS entity_type,
                    COALESCE({cfg['title_expr']}, '') AS title,
                    COALESCE({cfg['description_expr']}, '') AS description,
                    COALESCE({cfg['category_expr']}, '') AS category,
                    COALESCE({cfg['region_expr']}, '') AS region,
                    COALESCE({cfg['city_expr']}, '') AS city,
                    COALESCE({cfg['price_expr']}, 0) AS price,
                    COALESCE({cfg['location_expr']}, '') AS location,
                    {cfg['latitude_expr']} AS latitude,
                    {cfg['longitude_expr']} AS longitude,
                    {cfg['coordinates_expr']} AS coordinates,
                    COALESCE({cfg['address_expr']}, '') AS address,
                    {cfg['tags_expr']} AS tags,
                    FALSE AS is_enriched,
                    (1 - ("description_vector" <=> cast(:embedding as vector))) AS similarity_score
                FROM "{cfg['table']}"
                WHERE "description_vector" IS NOT NULL
                  AND (
                        (:city IS NULL AND :region IS NULL)
                        OR (:city IS NOT NULL AND LOWER(COALESCE({cfg['city_expr']}, '')) = LOWER(:city))
                        OR (:region IS NOT NULL AND LOWER(COALESCE({cfg['region_expr']}, '')) = LOWER(:region))
                    )
                  AND (:max_price IS NULL OR COALESCE({cfg['price_expr']}, 0) <= :max_price){tag_clause}
                ORDER BY "description_vector" <=> cast(:embedding as vector)
                LIMIT :top_k
                """
            )

            try:
                result = await session.execute(sql, params)
                rows = result.mappings().all()
            except Exception as e:
                logger.error(
                    "pgvector retrieval failed for entity_type=%s enforce_tags=%s: %s",
                    entity_type,
                    enforce_tags,
                    e,
                    exc_info=True,
                )
                return []

            table_results: list[RagSearchResult] = []
            for row in rows:
                description = str(row.get("description", "") or "")
                snippet = description[:200] + "..." if len(description) > 200 else description
                score = round(float(row.get("similarity_score", 0) or 0), 4)

                if score < settings.RAG_SCORE_THRESHOLD:
                    continue

                item = RagSearchResult(
                    entity_id=str(row.get("entity_id", "")),
                    entity_type=str(row.get("entity_type", entity_type)),
                    title=str(row.get("title", "")),
                    score=score,
                    snippet=snippet,
                    category=row.get("category", ""),
                    region=str(row.get("region", "") or ""),
                    city=str(row.get("city", "") or ""),
                    price=int(row.get("price", 0) or 0),
                    location=str(row.get("location", "") or ""),
                    latitude=float(row.get("latitude")) if row.get("latitude") is not None else None,
                    longitude=float(row.get("longitude")) if row.get("longitude") is not None else None,
                    coordinates=row.get("coordinates", {}) or {},
                    address=str(row.get("address", "") or ""),
                    description=description,
                    tags=await _to_string_list(row.get("tags", [])),
                    is_enriched=bool(row.get("is_enriched", False)),
                )
                table_results.append(item)

            table_results.sort(key=lambda item: item.score, reverse=True)
            return table_results

        table_candidates = await _execute_sql(enforce_tags=True)

        if len(table_candidates) < per_table_top_k and normalized_tags:
            logger.warning(
                "pgvector strict tags returned %d/%d for entity_type=%s; retrying without tags",
                len(table_candidates),
                per_table_top_k,
                entity_type,
            )
            relaxed_candidates = await _execute_sql(enforce_tags=False)
            seen_ids = {item.entity_id for item in table_candidates}
            for item in relaxed_candidates:
                if item.entity_id in seen_ids:
                    continue
                seen_ids.add(item.entity_id)
                table_candidates.append(item)

        table_candidates.sort(key=lambda item: item.score, reverse=True)
        all_candidates.extend(table_candidates[:per_table_top_k])

    all_candidates.sort(key=lambda item: item.score, reverse=True)
    return all_candidates


async def rag_query(
    query: str,
    entity_types: list[str] | None = None,
    region: str | None = None,
    city: str | None = None,
    max_price: int | None = None,
    tags: list[str] | None = None,
    top_k: int | None = None,
    session: AsyncSession | None = None,
) -> list[dict[str, Any]]:
    """Router-based retrieval that dispatches to Qdrant or pgvector."""
    logger.info(
        "RAG Query Input: query='%s', engine=%s, entity_types=%s, region=%s, city=%s, max_price=%s, tags=%s, top_k=%s",
        query,
        settings.VECTOR_ENGINE,
        entity_types,
        region,
        city,
        max_price,
        tags,
        top_k,
    )
    if top_k is None:
        top_k = settings.RAG_SIMILARITY_TOP_K

    logger.debug("Embedding query text...")
    query_vector = await _embed_text(query)
    vector_engine = str(settings.VECTOR_ENGINE or "pgvector").strip().lower()

    if vector_engine == "qdrant":
        results = await qdrant_search(
            query=query,
            query_vector=query_vector,
            entity_types=entity_types,
            region=region,
            city=city,
            max_price=max_price,
            tags=tags,
            top_k=top_k,
        )
    else:
        if vector_engine != "pgvector":
            logger.warning("Unknown VECTOR_ENGINE '%s'; defaulting to pgvector", vector_engine)
        assert session is not None, "AsyncSession is required when VECTOR_ENGINE='pgvector'"
        results = await pgvector_search(
            session=session,
            query_vector=query_vector,
            entity_types=entity_types,
            region=region,
            city=city,
            max_price=max_price,
            tags=tags,
            top_k=top_k,
        )

    logger.info("RAG Query Output: returning %d final results.", len(results))
    return [item.model_dump() for item in results]


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
