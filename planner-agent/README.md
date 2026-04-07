# Guidni Planner Agent

The **Planner Agent** is the core AI reasoning engine for the Guidni travel planner. Built with **FastAPI** + **LangGraph**, it powers an LLM-based assistant that plans trips to Djerba, Tunisia using real database data and semantic search (RAG).

---

## Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [The Agent Loop](#-the-agent-loop-think--act--observe)
- [RAG Layer (LlamaIndex)](#-rag-layer-llamaindex)
- [Tools Reference](#-tools-reference)
- [Reasoning Guardrails](#-reasoning-guardrails)
- [Plan Schema](#-plan-schema)
- [API Endpoints](#-api-endpoints)
- [Configuration](#%EF%B8%8F-configuration)
- [Setup & Running](#-setup--running)
- [Testing](#-testing)

---

## 🧠 Architecture Overview

```
┌────────────┐     POST /chat      ┌────────────────┐
│  Frontend  │ ──────────────────▶ │    FastAPI      │
│  (Next.js) │ ◀────────────────── │   main.py       │
└────────────┘     JSON response   └───────┬────────┘
                                           │
                                    ┌──────▼──────┐
                                    │  LangGraph  │
                                    │  brain.py   │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
             ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
             │   Thinker   │       │   Tools     │       │   RAG       │
             │  (LLM Call) │       │  (19 total) │       │ (LlamaIndex)│
             └─────────────┘       └──────┬──────┘       └──────┬──────┘
                                          │                      │
                                   ┌──────▼──────┐       ┌──────▼──────┐
                                   │ PostgreSQL  │       │ Vector Index│
                                   │  (asyncpg)  │       │ (bge-m3)   │
                                   └─────────────┘       └─────────────┘
```

**Core Technologies:**
| Component | Technology |
|---|---|
| Web Framework | FastAPI (Python) |
| Agent Orchestration | LangGraph & LangChain |
| LLM Providers | Ollama (local) / Groq (cloud fallback) |
| Database | PostgreSQL + SQLAlchemy (async) |
| Semantic Search | LlamaIndex + BAAI/bge-m3 embeddings |
| State Management | TypedDict (`AgentState`) |

---

## 📁 Project Structure

```
planner-agent/
├── app/
│   ├── main.py                    # FastAPI server, endpoints, startup hooks
│   ├── config.py                  # Pydantic Settings (env vars)
│   │
│   ├── agent/                     # The LangGraph agent
│   │   ├── brain.py               # Graph definition (THINK → TOOL → VALIDATE → RESPOND)
│   │   ├── state.py               # AgentState TypedDict (all state fields)
│   │   ├── personality.py         # System prompt + reasoning guardrails
│   │   └── nodes/
│   │       ├── thinker.py         # LLM reasoning node
│   │       ├── tool_executor.py   # Tool execution + state update
│   │       ├── validator.py       # Plan validation (duplicates, budget, structure)
│   │       └── responder.py       # Final response formatting + DB save
│   │
│   ├── rag/                       # LlamaIndex RAG layer
│   │   ├── settings.py            # Embedding model config (bge-m3)
│   │   ├── index_builder.py       # Full build + incremental upsert/delete
│   │   ├── query_engine.py        # Semantic search with filtering
│   │   └── db_events.py           # SQLAlchemy event hooks for auto-indexing
│   │
│   ├── tools/                     # All 19 LangChain tools
│   │   ├── registry.py            # Central tool registry
│   │   ├── rag_tools.py           # RAG semantic search tools (3)
│   │   ├── activity_tools.py      # Activity search/details/enrichment
│   │   ├── stay_tools.py          # Accommodation search
│   │   ├── restaurant_tools.py    # Restaurant search
│   │   ├── weather_tools.py       # Weather API
│   │   ├── geo_tools.py           # Distance + geocoding
│   │   ├── budget_tools.py        # Budget estimation
│   │   ├── plan_tools.py          # Plan creation/modification/save
│   │   ├── availability_tools.py  # Availability checking
│   │   └── communication_tools.py # ask_user tool
│   │
│   ├── db/                        # Database layer
│   │   ├── connection.py          # Async engine + session factory
│   │   ├── models.py              # SQLAlchemy ORM models (mirrors Prisma schema)
│   │   └── queries.py             # All query functions
│   │
│   ├── llm/
│   │   └── provider.py            # Unified LLM interface (Ollama/Groq + fallback)
│   │
│   ├── memory/
│   │   └── conversation.py        # Conversation history management
│   │
│   └── schemas/
│       ├── plan.py                # FullPlan, DayPlan, PlanSlot, BudgetBreakdown
│       └── response.py            # API response schemas
│
├── rag_storage/                   # Persisted vector index (auto-generated)
├── tests/
│   ├── test_tools.py              # Tool registration + unit tests
│   └── test_agent.py              # Agent integration tests
├── requirements.txt
├── .env                           # Environment configuration
├── Dockerfile
└── docker-compose.yml
```

---

## 🔄 The Agent Loop (THINK → ACT → OBSERVE)

The agent uses a **LangGraph state machine** with 4 nodes:

```
    ┌─────────────┐
    │    START     │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │    THINK    │◄───────────────┐
    │ (thinker.py)│                │
    └──────┬──────┘                │
           │                       │
    ┌──────▼──────┐         ┌──────┴──────┐
    │   ROUTE     │──tool──▶│EXECUTE_TOOL │
    └──┬──────────┘         └─────────────┘
       │
       │──plan_ready──▶ VALIDATE ──errors──▶ THINK (retry)
       │                    │
       │                    ok
       │                    │
       └──text/question──▶ RESPOND ──▶ END
```

### How it works:

1. **THINK** (`thinker.py`): The LLM receives the system prompt, conversation history, current context (user profile, RAG results, weather), and 19 available tools. It decides whether to call a tool or respond directly.

2. **EXECUTE_TOOL** (`tool_executor.py`): Runs the chosen tool (e.g., `rag_search_for_plan`, `get_weather`). The result is stored in `AgentState` (in fields like `rag_context`, `activities`, `weather`) and appended to messages. Flow returns to THINK.

3. **VALIDATE** (`validator.py`): Only triggered when `is_plan_ready=True`. Checks for duplicate activities, empty days, budget consistency. If errors found → back to THINK to fix.

4. **RESPOND** (`responder.py`): Formats the final output, classifies it as `text`/`plan`/`question`/`modification`, saves to DB, and returns to the client.

**Safety:** Max 15 iterations. After iteration 2 with RAG context, the thinker injects a system message telling the LLM to stop searching and generate the response.

---

## 🧩 RAG Layer (LlamaIndex)

The RAG layer provides **semantic search** over all database entities, enabling natural language queries like *"romantic sunset activities near the beach"*.

### How it works:

```
                    ┌──────────────┐
  DB Tables ──────▶ │ index_builder│ ──▶ Vector Index (rag_storage/)
  (Activity,        │              │         │
   Stay, Yummy,     │ bge-m3       │         │
   Attraction)      │ embeddings   │         │
                    └──────────────┘         │
                                             │
  User Query ─▶ query_engine.py ─▶ Retrieve ─┘
                      │
                      ▼
              Scored Results with
              entity_id, title, score,
              snippet, metadata
```

### Components:

| File | Role |
|---|---|
| `settings.py` | Configures `BAAI/bge-m3` multilingual embeddings (FR/EN/AR), disables LLM for retrieval |
| `index_builder.py` | **Full build**: Reads all Activity, Stay, Yummy, Attraction rows → creates VectorStoreIndex. **Incremental**: `upsert_entity()` / `delete_entity()` for single-entity updates. Uses MD5 content hashing to skip unchanged data |
| `query_engine.py` | `rag_query()` performs similarity search with metadata filters (entity_type, region, price). Returns scored, source-attributed results. `rag_find_similar()` finds alternatives to a known entity |
| `db_events.py` | SQLAlchemy `after_insert`/`after_update`/`after_delete` event listeners. Triggers **incremental re-indexing** automatically when DB data changes. Uses background asyncio tasks to avoid blocking |

### Indexing pipeline:

Each database entity is converted to a LlamaIndex `Document`:
- **text**: Concatenation of title + description + category + region + city + all metadata fields
- **metadata**: `entity_type`, `entity_id`, `title`, `category`, `region`, `city`, `price`

The index is persisted to `./rag_storage/` and loaded on startup. First startup downloads the bge-m3 model (~2.2 GB).

### Entity type distinction:

| entity_type | Source Table | Usage in Plan |
|---|---|---|
| `activity` | Activity | Daytime time slots (tours, sports, sightseeing) |
| `stay` | Stay | **Overnight accommodation ONLY** — never as a daytime activity |
| `restaurant` | Yummy | Meal slots (lunch/dinner) |
| `attraction` | Attraction | Free sightseeing time slots |

---

## 🛠️ Tools Reference

The agent has **19 tools** registered in `app/tools/registry.py`:

### RAG Semantic Search (3 tools)
| Tool | Description |
|---|---|
| `rag_search` | General semantic search. Filter by `entity_type`, `region`, `top_k` |
| `rag_search_for_plan` | Themed search for plan-building. Accepts `num_days` to auto-scale result count. Groups results by type (activities, restaurants, stays, attractions) |
| `rag_get_similar` | Find entities similar to a known entity (for alternatives) |

### User & Communication (2 tools)
| Tool | Description |
|---|---|
| `get_user_profile` | Fetch user preferences, history, wishlists from DB |
| `ask_user` | Ask the user a clarifying question |

### Search & Discovery (5 tools)
| Tool | Description |
|---|---|
| `search_activities` | SQL search for activities by region, category, price |
| `get_activity_details` | Get full details for a specific activity by ID |
| `enrich_activity` | Use LLM to analyze an activity's noise level, ambiance, intensity |
| `search_stays` | SQL search for accommodation by region, price, rating |
| `search_restaurants` | SQL search for restaurants/cafes |

### Environment & Location (3 tools)
| Tool | Description |
|---|---|
| `get_weather` | Weather forecast for a region/date |
| `get_distance` | Haversine distance calculation between two lat/lng points |
| `geocode_address` | Convert an address to coordinates (Nominatim API) |

### Planning & Budget (6 tools)
| Tool | Description |
|---|---|
| `check_availability` | Check if an activity has capacity available |
| `estimate_daily_budget` | Calculate daily cost (activities + meals + transport) |
| `estimate_trip_budget` | Calculate total trip cost over N days |
| `create_plan_structure` | Build a structured `FullPlan` from gathered data |
| `modify_plan` | Modify an existing plan (swap activities, change days) |
| `save_plan_tool` | Persist the plan to the database |

---

## 🛡️ Reasoning Guardrails

These rules are embedded in the agent's system prompt (`personality.py`):

1. **Query Decomposition** — Multi-day trips (7+) are broken into sub-goals
2. **Context Hygiene** — Never hallucinate places/IDs. Only use data from tool results
3. **Entity Type Rules** — Stays = accommodation only, never as daytime activities
4. **Iteration Efficiency** — Complete plans in under 6 iterations when possible
5. **Geospatial Logic** — Group activities by proximity, check distances between transitions
6. **RAG vs SQL** — Use RAG for semantic queries, SQL for exact filters
7. **Output Format** — All plans must use real entity IDs from tool results

---

## 📋 Plan Schema

The structured plan output follows these Pydantic models (`app/schemas/plan.py`):

```
FullPlan
├── days: list[DayPlan]
│   ├── day_number: int
│   ├── date: str (ISO)
│   ├── theme: str ("Romance & Relaxation")
│   └── slots: list[PlanSlot]
│       ├── time / end_time: str ("09:00" / "11:00")
│       ├── type: str ("activity" | "meal" | "rest" | "stay_suggestion")
│       ├── activity_id: str (real DB ID)
│       ├── title / description / category
│       ├── price: float (TND)
│       ├── duration: int (minutes)
│       ├── reason: str ("I recommend this because...")
│       └── bookable: bool
├── stay_suggestions: list[StaySuggestion]
│   ├── stay_id / title / price / rating / reason
├── budget_breakdown: BudgetBreakdown
│   ├── activities / accommodation / food / transport / total
├── summary: str
└── tips: list[str]
```

---

## 🌐 API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | Send a message and get the agent's response |
| `GET` | `/conversations/{user_id}` | List all conversations for a user |
| `GET` | `/conversations/{user_id}/{conv_id}` | Get full conversation history |
| `GET` | `/users` | List all users |
| `POST` | `/admin/rebuild-index` | **Admin**: Force full RAG index rebuild |
| `GET` | `/health` | Health check (DB, LLM, RAG status) |

### Chat Request:
```json
{
  "user_id": "cmm9angei000086ymwqkhhaft",
  "message": "Plan me a 5-day romantic trip in Djerba",
  "conversation_id": null
}
```

### Chat Response:
```json
{
  "conversation_id": "d6c71999-...",
  "response_type": "plan",
  "content": "Here's your 5-day romantic itinerary...",
  "plan": { "days": [...], "budget_breakdown": {...} },
  "thinking_steps": [
    { "step": "🧠 Searching for themed activities...", "tool_used": "rag_search_for_plan" },
    { "step": "💰 Estimating trip budget...", "tool_used": "estimate_trip_budget" }
  ],
  "questions": null
}
```

### Health Check Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "ollama": "connected",
  "rag_index": "loaded (47 documents)"
}
```

---

## ⚙️ Configuration

All configuration is loaded from `.env` via Pydantic Settings:

```env
# ===== LLM Provider =====
LLM_PROVIDER=ollama                    # "ollama" or "groq"

# ===== Ollama (Local LLM) =====
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:32b              # or qwen2.5:7b for faster inference

# ===== Groq (Cloud Fallback) =====
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# ===== Database =====
DATABASE_URL=postgresql+asyncpg://postgres:0000@localhost:5432/guidni_db

# ===== Weather API =====
WEATHER_API_KEY=your_key_here

# ===== Defaults =====
DEFAULT_REGION=Djerba
```

### RAG Configuration (in `app/rag/settings.py`):
| Setting | Default | Description |
|---|---|---|
| Embedding Model | `BAAI/bge-m3` | Multilingual (FR/EN/AR), ~2.2 GB download |
| Chunk Size | 512 tokens | With 50-token overlap |
| Storage | `./rag_storage/` | Persisted vector index directory |
| LLM for RAG | Disabled | Only embeddings used; agent handles reasoning |

---

## 🚀 Setup & Running

### Prerequisites
- Python 3.11+
- PostgreSQL running with Guidni schema (via Prisma)
- Ollama running with `qwen2.5:32b` (or `qwen2.5:7b`)

### Install dependencies:
```bash
cd planner-agent
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Start the server:
```bash
# Development (with hot reload and debug logging)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### First startup:
1. The **bge-m3 embedding model** (~2.2 GB) downloads automatically
2. The RAG index is built from all DB entities (Activity, Stay, Yummy, Attraction)
3. SQLAlchemy event listeners are registered for auto-indexing
4. Look for: `🧠 RAG index loaded and DB event listeners registered`

### Terminal output (what you see):
```
🚀 Planner Agent starting up...
   LLM Provider: ollama
   Ollama Model: qwen2.5:32b
   Database: postgresql+asyncpg://postgres:...
🧠 RAG index loaded and DB event listeners registered
INFO:     Uvicorn running on http://0.0.0.0:8000

══════════════════════════════════════════════════
▶ Step 1: [THINK]
   💭 🧠 Searching for themed activities and dining...
   🔧 Tool: rag_search_for_plan
   🔄 Iteration: 1
══════════════════════════════════════════════════
▶ Step 2: [EXECUTE_TOOL]
   💭 ✅ rag_search_for_plan completed
   📋 Result: Got: theme, activities_for_time_slots...
══════════════════════════════════════════════════
▶ Step 3: [THINK]
   💭 Based on your preferences for a romantic trip...
   🔄 Iteration: 2
══════════════════════════════════════════════════
▶ Step 4: [RESPOND]
   📤 Response type: text
══════════════════════════════════════════════════
✅ Agent completed: type=text, iterations=2, tools=['rag_search_for_plan']
```

---

## 🧪 Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Quick health check
curl http://localhost:8000/health

# Test a chat message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID", "message": "Plan a 3-day family trip"}'

# Rebuild RAG index manually
curl -X POST http://localhost:8000/admin/rebuild-index
```

---

*Powered by the Guidni AI Engine — Built with FastAPI, LangGraph, LlamaIndex, and ❤️*
