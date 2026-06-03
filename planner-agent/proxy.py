import asyncio
import os
import subprocess
import sys
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

subprocesses = []

def start_backend_processes():
    print("🚀 Starting Planner Agent backend on port 8000...")
    backend_proc = subprocess.Popen(
        ["uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    subprocesses.append(backend_proc)

    print("🎯 Starting LinUCB Recommendation API on port 8001...")
    reco_proc = subprocess.Popen(
        ["uvicorn", "app.reco.recommendation_router:app", "--host", "127.0.0.1", "--port", "8001"],
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    subprocesses.append(reco_proc)

    print("📊 Starting Phoenix Server on port 6006...")
    try:
        # زدت الـ port هنا باش يقرا من 6006 كيف ما في الـ Plan
        phoenix_proc = subprocess.Popen(
            ["python3", "-m", "phoenix.server.main", "serve", "--port", "6006"],
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        subprocesses.append(phoenix_proc)
    except Exception as e:
        print(f"⚠️ Failed to start Phoenix Server: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_backend_processes()
    await asyncio.sleep(5) # عطيناه 5 ثواني باش السيرفرات الكل تبدا مرتاحة
    yield
    print("👋 Shutting down all backend processes...")
    for proc in subprocesses:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except Exception as e:
            print(f"Error terminating process: {e}")
    await client.aclose()

app = FastAPI(
    title="Guidni Unified Proxy",
    description="Unified API gateway routing to Planner Backend and Recommendation API on HF Spaces",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 تصليح 1: الـ Timeout رديناه 5 دقائق كاملة باش الـ AI ياخذ وقتو وميسكرش
client = httpx.AsyncClient(timeout=httpx.Timeout(300.0))

BACKEND_URL = "http://127.0.0.1:8000"
RECO_URL = "http://127.0.0.1:8001"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy(request: Request, path: str):
    if path.startswith("api/recommendations"):
        target_url = f"{RECO_URL}/{path}"
    else:
        target_url = f"{BACKEND_URL}/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)
    
    req = client.build_request(
        method=request.method,
        url=target_url,
        headers=headers,
        params=request.query_params,
        content=await request.body()
    )

    try:
        resp = await client.send(req, stream=True)
        
        # 🔥 تصليح 2: تنظيف الـ Connection Leak بالقوة بعد نهاية الـ Stream باش الميموري ميتخنقش
        async def stream_generator():
            async for chunk in resp.aiter_raw():
                yield chunk
            await resp.aclose()

        return StreamingResponse(
            stream_generator(),
            status_code=resp.status_code,
            headers=dict(resp.headers)
        )
    except httpx.ConnectError:
        return Response(
            content='{"detail": "Service temporarily starting or unavailable. Retrying..."}',
            status_code=503,
            media_type="application/json"
        )
    except Exception as e:
        return Response(
            content=f'{{"detail": "Proxy error: {str(e)}"}}',
            status_code=500,
            media_type="application/json"
        )