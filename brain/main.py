"""
Guidni AI Brain — FastAPI entry point.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Configure logging FIRST — sets all loggers to INFO ────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)

from config import get_settings
from embeddings.bge_m3 import EmbeddingService
from qdrant.client import get_qdrant_client


# ── Lifespan: warm up models + connections on startup ─────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    # Warm up the embedding model (downloads on first run)
    print("[BRAIN] Loading BGE-M3 embedding model...")
    embedding_svc = EmbeddingService.get_instance()
    print(f"[BRAIN] BGE-M3 loaded — dimension: {settings.embedding_dimension}")

    # Verify Qdrant connection
    client = get_qdrant_client()
    collections = client.get_collections().collections
    print(f"[BRAIN] Qdrant connected — {len(collections)} collections found")

    yield

    print("[BRAIN] Shutting down...")


# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title="Guidni AI Brain",
    description="RAG-powered travel planner with Qdrant metadata pre-filtering and BGE-M3 embeddings",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────
from routes.health import router as health_router
from routes.search import router as search_router
from routes.ingest import router as ingest_router
from routes.plan import router as plan_router
from routes.recommend import router as recommend_router

app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(search_router, prefix="/api/search", tags=["Search"])
app.include_router(ingest_router, prefix="/api/ingest", tags=["Ingestion"])
app.include_router(plan_router, prefix="/api/plan", tags=["Plan"])
app.include_router(recommend_router, prefix="/api/recommend", tags=["Recommendations"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
