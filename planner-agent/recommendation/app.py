from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from recommendation.recommend import router as recommend_router

app = FastAPI(title="Thompson Sampling API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend_router, prefix="/api/recommend")
