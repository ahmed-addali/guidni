"""API request schemas (Pydantic models)."""

from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    """Main chat endpoint request."""
    user_id: str
    conversation_id: Optional[str] = None
    message: str
    model: Optional[str] = None  # e.g. "gemini/gemini-2.5-flash", "ollama/qwen2.5:7b"


class BookRequest(BaseModel):
    """Book activities from a plan."""
    plan_id: str
    activity_ids: Optional[list[str]] = None  # None = book all
