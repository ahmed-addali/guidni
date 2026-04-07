"""FastAPI Server — the entry point for the planner agent.

Endpoints:
    POST /chat                              — Main chat endpoint (Next.js calls this)
    GET  /conversations/{user_id}           — List user conversations
    GET  /conversations/detail/{conv_id}    — Get conversation with messages
    DELETE /conversations/{conv_id}         — Archive conversation
    GET  /health                            — Health check
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy import text

from app.config import settings
from app.schemas.requests import ChatRequest
from app.schemas.responses import PlannerResponse, ThinkingStep, QuestionOption
from app.schemas.plan import FullPlan
from app.schemas.plan_request import PlanRequest, parse_chat_to_plan_request
from app.db.connection import async_session, engine
from app.db import queries
from app.agent.brain import run_agent
from app.services.plan_pipeline import run_plan_pipeline
from app.memory.conversation import load_context, update_context
from app.memory.summarizer import summarize_if_needed

# Configure logging — console + file
import json
import os
from logging.handlers import RotatingFileHandler

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DETAILED_FORMAT = "%(asctime)s [%(name)s] %(levelname)s\n%(message)s\n"

# Root logger setup
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)

# Console handler (INFO level)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter(LOG_FORMAT))
root_logger.addHandler(console_handler)

# Main log file (INFO level, 10 MB rotation, keep 5 backups)
file_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "agent.log"),
    maxBytes=10 * 1024 * 1024,  # 10 MB
    backupCount=5,
    encoding="utf-8",
)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
root_logger.addHandler(file_handler)

# Detailed log file (DEBUG level — captures EVERYTHING: LLM input/output, tool data)
detailed_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "agent_detailed.log"),
    maxBytes=50 * 1024 * 1024,  # 50 MB
    backupCount=3,
    encoding="utf-8",
)
detailed_handler.setLevel(logging.DEBUG)
detailed_handler.setFormatter(logging.Formatter(DETAILED_FORMAT))
root_logger.addHandler(detailed_handler)

# Quiet noisy third-party loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("hpack").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)



# --- إضافة كود الـ Monitoring الجديد ---
from phoenix.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

# 1. تسجيل الـ Tracer Provider (يربط الكود بـ Phoenix)
tracer_provider = register()

# 2. تفعيل التتبع لـ LangChain/LangGraph
LangChainInstrumentor().instrument(tracer_provider=tracer_provider)
# ----------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("🚀 Planner Agent starting up...")
    logger.info("   LLM Provider: %s", settings.LLM_PROVIDER)
    if settings.LLM_PROVIDER == "ollama":
        logger.info("   Ollama URL: %s", settings.OLLAMA_BASE_URL)
        logger.info("   Ollama Model: %s", settings.OLLAMA_MODEL)
    else:
        logger.info("   Groq Model: %s", settings.GROQ_MODEL)
    logger.info("   Database: %s", settings.DATABASE_URL[:50] + "...")
    logger.info("   Default Region: %s", settings.DEFAULT_REGION)

    # Initialize RAG
    try:
        from app.rag.settings import initialize_rag_settings
        from app.rag.index_builder import load_or_build_index
        from app.rag.db_events import register_db_events

        initialize_rag_settings()
        await load_or_build_index()
        register_db_events()
        logger.info("🧠 RAG index loaded and DB event listeners registered")
    except Exception as e:
        logger.error("⚠️ RAG initialization failed: %s", e, exc_info=True)
        logger.warning("   Agent will work without RAG — SQL tools still available")

    yield
    # Cleanup
    await engine.dispose()
    logger.info("👋 Planner Agent shutting down")


app = FastAPI(
    title="Guidni Planner Agent",
    description="AI-powered travel planner for Djerba, Tunisia",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js to call
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Plan Pipeline Endpoint =====

@app.post("/plan")
async def generate_plan(request: PlanRequest):
    """Structured plan generation — 3-phase pipeline (no agent loop).

    Collects all data in parallel (RAG, weather, distances, budget),
    pre-processes constraints, then assembles the plan with a single LLM call.
    """
    try:
        # Validate user exists
        async with async_session() as session:
            user = await queries.get_user(session, request.user_id)
            if not user:
                raise HTTPException(
                    status_code=404,
                    detail=f"User '{request.user_id}' not found."
                )

        # Parse model selection if provided
        llm_provider = None
        llm_model = None
        if request.model:
            from app.llm.provider import parse_model_id
            try:
                llm_provider, llm_model = parse_model_id(request.model)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

        # Run the 3-phase pipeline
        plan_json = await run_plan_pipeline(
            request=request,
            provider=llm_provider,
            model=llm_model,
        )

        # Create conversation and save the plan
        conversation_id = request.conversation_id
        if not conversation_id:
            async with async_session() as session:
                conversation_id = await queries.create_conversation(
                    session, request.user_id
                )

        # Save the user message and assistant response
        message_text = (
            f"Plan a {request.num_days}-day {request.traveler_type} trip in {request.region}. "
            f"Interests: {', '.join(request.interests)}. Budget: {request.budget_level}."
        )
        async with async_session() as session:
            await queries.add_message(
                session, conversation_id, role="user", content=message_text
            )
            await queries.add_message(
                session, conversation_id, role="assistant",
                content=json.dumps(plan_json, ensure_ascii=False),
                message_type="plan",
            )

        return {
            "conversation_id": conversation_id,
            "response_type": "plan",
            **plan_json,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Plan pipeline error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===== Main Chat Endpoint =====

@app.post("/chat", response_model=PlannerResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint — receives a message, runs the agent, returns response.

    If the message matches a structured plan request pattern, it is automatically
    routed to the fast plan pipeline. Otherwise, the full agent loop is used.

    Flow:
    1. Try to detect structured plan request → pipeline
    2. If not a plan request → full agent loop
    """
    try:
        conversation_id = request.conversation_id

        # 0. Validate user exists
        async with async_session() as session:
            user = await queries.get_user(session, request.user_id)
            if not user:
                raise HTTPException(
                    status_code=404,
                    detail=f"User '{request.user_id}' not found. Use GET /users to find valid user IDs."
                )

        # ── AUTO-DETECT: route plan requests to the fast pipeline ──
        plan_request = parse_chat_to_plan_request(request.message, request.user_id)
        if plan_request:
            logger.info("Auto-detected plan request → routing to pipeline")
            plan_request.conversation_id = request.conversation_id
            plan_request.model = request.model

            # Parse model
            p_provider = None
            p_model = None
            if request.model:
                from app.llm.provider import parse_model_id
                try:
                    p_provider, p_model = parse_model_id(request.model)
                except ValueError:
                    pass

            plan_json = await run_plan_pipeline(
                request=plan_request,
                provider=p_provider,
                model=p_model,
            )

            # Create conversation if needed
            if not conversation_id:
                async with async_session() as session:
                    conversation_id = await queries.create_conversation(
                        session, request.user_id
                    )

            # Save messages
            async with async_session() as session:
                await queries.add_message(
                    session, conversation_id, role="user", content=request.message
                )
                await queries.add_message(
                    session, conversation_id, role="assistant",
                    content=json.dumps(plan_json, ensure_ascii=False),
                    message_type="plan",
                )

            return PlannerResponse(
                conversation_id=conversation_id,
                response_type="plan",
                content="Here's your personalized travel plan!",
                plan=None,  # raw JSON is in the plan_json
                thinking_steps=[
                    ThinkingStep(step="Detected plan request — using fast pipeline"),
                    ThinkingStep(step="Collected activities, restaurants, weather, distances"),
                    ThinkingStep(step="Assembled plan with single LLM call"),
                ],
                ids=[],
            )
        # ── END AUTO-DETECT ──

        # 1. Create conversation if needed
        if not conversation_id:
            async with async_session() as session:
                conversation_id = await queries.create_conversation(
                    session, request.user_id
                )
            logger.info("Created new conversation: %s", conversation_id)

        # 2. Load context
        context = await load_context(conversation_id)

        # 3. Save user message
        async with async_session() as session:
            await queries.add_message(
                session, conversation_id, role="user", content=request.message
            )

        # 4. Build messages for the agent
        messages = context["recent_messages"]
        messages.append(HumanMessage(content=request.message))

        # Add context summary if exists
        if context["context_summary"]:
            messages.insert(
                0,
                SystemMessage(
                    content=f"## Previous Conversation Context\n{context['context_summary']}"
                ),
            )

        # 5. Run the agent
        # Parse model selection if provided (format: "provider/model_name")
        llm_provider = None
        llm_model = None
        if request.model:
            from app.llm.provider import parse_model_id
            try:
                llm_provider, llm_model = parse_model_id(request.model)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

        result = await run_agent(
            user_id=request.user_id,
            conversation_id=conversation_id,
            messages=messages,
            current_plan=context["current_plan"],
            llm_provider=llm_provider,
            llm_model=llm_model,
        )

        # 6. Update context
        await update_context(conversation_id, result)

        # 7. Summarize if conversation is getting long
        await summarize_if_needed(conversation_id)

        # 8. Build response
        thinking_steps = [
            ThinkingStep(**step) for step in result.get("thinking_steps", [])
        ]

        questions = None
        if result.get("questions"):
            questions = [
                QuestionOption(
                    question=q.get("question", ""),
                    suggestions=q.get("suggestions", []),
                )
                for q in result["questions"]
            ]

        plan = None
        extracted_ids = []
        if result.get("final_plan"):
            try:
                plan = FullPlan(**result["final_plan"])
                
                # Extract all unique IDs from the plan
                seen_ids = set()
                
                for day in plan.days:
                    for slot in day.slots:
                        if slot.activity_id and slot.activity_id not in seen_ids:
                            seen_ids.add(slot.activity_id)
                            item_type = slot.type
                            if item_type == "meal":
                                item_type = "yummy"
                            elif item_type == "stay_suggestion" or item_type == "accommodation":
                                item_type = "accommodation"
                            
                            if item_type in ["activity", "yummy", "accommodation"]:
                                extracted_ids.append({"id": slot.activity_id, "type": item_type})
                
                for stay in plan.stay_suggestions:
                    if stay.stay_id and stay.stay_id not in seen_ids:
                        seen_ids.add(stay.stay_id)
                        extracted_ids.append({"id": stay.stay_id, "type": "accommodation"})
                        
            except Exception as e:
                logger.warning("Failed to parse plan: %s", e)

        return PlannerResponse(
            conversation_id=conversation_id,
            response_type=result.get("response_type", "text"),
            content=result.get("final_response", ""),
            plan=plan,
            thinking_steps=thinking_steps,
            questions=questions,
            ids=extracted_ids,
        )

    except HTTPException:
        raise  # Re-raise 404 etc. as-is
    except Exception as e:
        logger.error("Chat error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===== Conversation Endpoints =====

@app.get("/conversations/{user_id}")
async def list_conversations(user_id: str):
    """List all conversations for a user."""
    async with async_session() as session:
        conversations = await queries.get_conversations_by_user(session, user_id)
    return {"conversations": conversations}


@app.get("/conversations/detail/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all messages."""
    async with async_session() as session:
        conv = await queries.get_conversation(session, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@app.delete("/conversations/{conversation_id}")
async def archive_conversation(conversation_id: str):
    """Archive (deactivate) a conversation."""
    async with async_session() as session:
        success = await queries.delete_conversation(session, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"archived": True}


# ===== Users Endpoint (for test UI) =====

@app.get("/users")
async def list_users():
    """List available users (for the test chat UI to pick a valid user)."""
    async with async_session() as session:
        result = await session.execute(
            text('SELECT id, name, email, image FROM "User" LIMIT 20')
        )
        users = [
            {"id": row.id, "name": row.name, "email": row.email, "image": row.image}
            for row in result
        ]
    return {"users": users}


# ===== Models Endpoint (for frontend selector) =====

@app.get("/models")
async def list_models():
    """List available LLM models for the frontend selector."""
    from app.llm.provider import get_available_models
    return {"models": get_available_models()}


# ===== Admin Endpoints =====

@app.post("/admin/rebuild-index")
async def rebuild_index():
    """Rebuild the RAG vector index from scratch.

    This is a fallback endpoint for when incremental indexing
    gets out of sync. Normally, the index auto-updates on DB changes.
    """
    try:
        from app.rag.settings import initialize_rag_settings
        from app.rag.index_builder import build_full_index, get_index

        initialize_rag_settings()
        index = await build_full_index()

        # Count indexed documents
        doc_count = len(index.storage_context.docstore.docs)

        return {
            "status": "success",
            "message": f"RAG index rebuilt with {doc_count} documents",
            "documents_indexed": doc_count,
        }
    except Exception as e:
        logger.error("Index rebuild failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")


# ===== Health Check =====

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    health = {
        "status": "ok",
        "default_provider": settings.LLM_PROVIDER,
        "region": settings.DEFAULT_REGION,
    }

    # Check DB
    try:
        async with async_session() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        health["database"] = "connected"
    except Exception as e:
        health["database"] = f"error: {str(e)[:100]}"

    # Check Ollama
    if settings.LLM_PROVIDER == "ollama":
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5.0
                )
                if resp.status_code == 200:
                    health["ollama"] = "connected"
                else:
                    health["ollama"] = f"error: status {resp.status_code}"
        except Exception as e:
            health["ollama"] = f"error: {str(e)[:100]}"

    # Check RAG index
    try:
        from app.rag.index_builder import get_index
        index = get_index()
        if index is not None:
            doc_count = len(index.storage_context.docstore.docs)
            health["rag_index"] = f"loaded ({doc_count} documents)"
        else:
            health["rag_index"] = "not loaded"
    except Exception as e:
        health["rag_index"] = f"error: {str(e)[:100]}"

    return health
