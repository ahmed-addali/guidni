# 🚀 Getting Started — Guidni Planner Agent

A complete step-by-step guide for new developers to set up and run the Planner Agent on their machine.

---

## 📋 Prerequisites

Before you start, make sure you have these installed:

| Tool | Version | Download |
|---|---|---|
| **Python** | 3.11 or higher | [python.org](https://www.python.org/downloads/) |
| **PostgreSQL** | 14+ | [postgresql.org](https://www.postgresql.org/downloads/) |
| **Ollama** | Latest | [ollama.com](https://ollama.com/download) |
| **Node.js** | 18+ (for frontend) | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

> **Hardware**: The LLM model (qwen2.5:32b) needs ~20 GB RAM. If you don't have that, use `qwen2.5:7b` (~5 GB RAM) instead.

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd guidni/planner-agent
```

---

## Step 2: Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

This installs: FastAPI, LangGraph, LangChain, SQLAlchemy, LlamaIndex, and all other dependencies.

> **Note**: The first time the server starts, it will download the **bge-m3 embedding model** (~2.2 GB). This is automatic and only happens once.

---

## Step 3: Set Up PostgreSQL Database

### 3.1 — Make sure PostgreSQL is running

```bash
# Check if PostgreSQL is running
# Windows: Check Services app or run:
pg_isready

# Expected output: localhost:5432 - accepting connections
```

### 3.2 — Create the database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE guidni_db;

# Exit
\q
```

### 3.3 — Apply the schema (using Prisma from the main project)

```bash
# Go to the root project directory (where schema.prisma lives)
cd ../
npx prisma db push
cd planner-agent
```

> **Important**: The database must contain data in the `Activity`, `Stay`, `Yummy`, and `Attraction` tables for the RAG index and search tools to work. You can populate data using Prisma Studio: `npx prisma studio`

---

## Step 4: Install and Configure Ollama

### 4.1 — Install Ollama

Download from [ollama.com](https://ollama.com/download) and install it.

### 4.2 — Pull the LLM model

```bash
# Recommended (requires ~20 GB RAM):
ollama pull qwen2.5:32b

# Lightweight alternative (requires ~5 GB RAM):
ollama pull qwen2.5:7b
```

### 4.3 — Verify Ollama is running

```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response listing your downloaded models.

> **Alternative — Use Groq (cloud) instead of Ollama**: If you don't want to run a local LLM, get a free API key from [console.groq.com](https://console.groq.com) and set `LLM_PROVIDER=groq` in `.env`.

---

## Step 5: Configure Environment Variables

```bash
# Copy the example .env file
cp .env.example .env
```

Now edit `.env` with your settings:

```env
# ===== LLM Provider =====
LLM_PROVIDER=ollama              # "ollama" or "groq"

# ===== Ollama (Local LLM) =====
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:32b        # or qwen2.5:7b

# ===== Groq (Cloud Fallback) =====
GROQ_API_KEY=                    # Only needed if LLM_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile

# ===== Database =====
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/guidni_db

# ===== Weather API (optional) =====
WEATHER_API_KEY=                 # From openweathermap.org (free tier)

# ===== Defaults =====
DEFAULT_REGION=Djerba
```

> **⚠️ Replace `YOUR_PASSWORD`** with your actual PostgreSQL password.

---

## Step 6: Start the Server

```bash
cd planner-agent

# Activate virtual environment (if not already)
venv\Scripts\activate    # Windows
source venv/bin/activate # macOS/Linux

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug
```

### What happens on startup:

```
🚀 Planner Agent starting up...
   LLM Provider: ollama
   Ollama Model: qwen2.5:32b
   Database: postgresql+asyncpg://postgres:...
   Default Region: Djerba
🧠 RAG index loaded and DB event listeners registered
INFO:     Uvicorn running on http://0.0.0.0:8000
```

> **First startup is slower**: The bge-m3 embedding model (~2.2 GB) downloads automatically, and the RAG index is built from all database entities. Subsequent startups are fast (index loads from `./rag_storage/`).

---

## Step 7: Verify Everything Works

### 7.1 — Health Check

Open your browser or run:

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "ollama": "connected",
  "rag_index": "loaded (47 documents)"
}
```

✅ If all three show "connected"/"loaded", you're good!

### 7.2 — Get available users

```bash
curl http://localhost:8000/users
```

Pick a `user_id` from the response. You need this for chat.

### 7.3 — Send your first chat message

```bash
curl -X POST http://localhost:8000/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\": \"YOUR_USER_ID\", \"message\": \"Plan me a 3-day romantic trip in Djerba\"}"
```

> **On macOS/Linux** use `\` instead of `^` for line continuation, and single quotes for the JSON body.

### 7.4 — Check the terminal

You'll see the agent's thinking process in real time:

```
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
   💭 Based on your preferences...
   🔄 Iteration: 2
══════════════════════════════════════════════════
▶ Step 4: [RESPOND]
   📤 Response type: text
══════════════════════════════════════════════════
✅ Agent completed: type=text, iterations=2, tools=['rag_search_for_plan']
```

---

## 📡 API Reference — All Endpoints

The server runs at **`http://localhost:8000`**.

### Chat (main endpoint)

```
POST http://localhost:8000/chat
```

**Request body:**
```json
{
  "user_id": "cmm9angei000086ymwqkhhaft",
  "message": "I want a 5-day family adventure in Djerba, budget 1500 TND",
  "conversation_id": null
}
```

- `user_id` — **(required)** The user's ID from the database
- `message` — **(required)** The user's message
- `conversation_id` — *(optional)* Pass an existing conversation ID to continue a conversation. Set to `null` for a new conversation.

**Response:**
```json
{
  "conversation_id": "d6c71999-9cbe-4cc5-949c-6cb8ca4e90ae",
  "response_type": "text",
  "content": "Here's your 5-day family itinerary...",
  "plan": null,
  "thinking_steps": [
    {
      "step": "🧠 Searching for themed activities and dining...",
      "tool_used": "rag_search_for_plan",
      "result_summary": "Got: theme, activities_for_time_slots..."
    }
  ],
  "questions": null
}
```

---

### List Users

```
GET http://localhost:8000/users
```

Returns all users in the database. Use a `user_id` from here for chat.

---

### List Conversations

```
GET http://localhost:8000/conversations/{user_id}
```

Returns all conversations for a user.

---

### Get Conversation History

```
GET http://localhost:8000/conversations/{user_id}/{conversation_id}
```

Returns the full message history of a conversation.

---

### Health Check

```
GET http://localhost:8000/health
```

Returns the status of the database, LLM, and RAG index.

---

### Rebuild RAG Index (Admin)

```
POST http://localhost:8000/admin/rebuild-index
```

Forces a full rebuild of the vector search index from all database entities. Use this if data was imported directly into PostgreSQL without going through the ORM.

**Response:**
```json
{
  "status": "success",
  "message": "RAG index rebuilt with 47 documents",
  "documents_indexed": 47
}
```

---

## 🐳 Docker Setup (Alternative)

If you prefer Docker:

```bash
cd planner-agent

# Start everything (Ollama + Planner Agent)
docker compose up -d

# Check logs
docker compose logs -f planner-agent

# Stop
docker compose down
```

This automatically:
- Starts Ollama and pulls the LLM model
- Builds and starts the Planner Agent
- Connects to your host PostgreSQL database

> **Note**: PostgreSQL must be running on your host machine. Docker uses `host.docker.internal` to connect.

---

## 🔧 Troubleshooting

### "RAG initialization failed"
- Make sure PostgreSQL is running and has data in `Activity`, `Stay`, `Yummy` tables
- Run `POST http://localhost:8000/admin/rebuild-index` to force rebuild

### "NotImplementedError: bind_tools"
- Your Ollama model may not support tool calling. Use `qwen2.5:7b` or `qwen2.5:32b`

### "Connection refused" to Ollama
- Make sure Ollama is running: `ollama serve`
- Check the URL matches your `.env`: `OLLAMA_BASE_URL=http://localhost:11434`

### Very slow first startup
- The bge-m3 embedding model (~2.2 GB) downloads on first run. Wait for it to finish.
- Check progress in the terminal logs

### 0 results from RAG search
- The database might be empty. Populate Activity/Stay/Yummy tables first.
- Rebuild the index: `POST http://localhost:8000/admin/rebuild-index`

### Agent takes too long / loops many times
- Switch to `qwen2.5:32b` for better reasoning (needs 20 GB RAM)
- The agent is capped at 15 iterations max

---

## 📂 Key Files to Know

| File | What it does |
|---|---|
| `app/main.py` | FastAPI server, all endpoints, startup hooks |
| `app/config.py` | Loads `.env` configuration |
| `app/agent/brain.py` | The LangGraph agent loop (THINK → TOOL → RESPOND) |
| `app/agent/personality.py` | System prompt + reasoning guardrails |
| `app/agent/nodes/thinker.py` | Calls the LLM to decide next action |
| `app/agent/nodes/tool_executor.py` | Executes tools and updates state |
| `app/tools/registry.py` | All 19 tools registered here |
| `app/tools/rag_tools.py` | RAG semantic search tools |
| `app/rag/index_builder.py` | Builds/updates the vector index |
| `app/rag/query_engine.py` | Performs semantic search queries |
| `app/schemas/plan.py` | Plan output data structure |
| `.env` | Your local configuration |

---

*Need help? Check the main [README.md](README.md) for architecture details.*
