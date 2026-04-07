"""Gemini cloud LLM via LangChain's ChatGoogleGenerativeAI.

Supports Gemini 2.0 Flash, 2.5 Flash, and 2.5 Flash Lite.
Same interface as Ollama/Groq — swap with one config change.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings


def create_gemini_llm(
    temperature: float = 0.7,
    json_mode: bool = False,
    model: str = None,
) -> ChatGoogleGenerativeAI:
    """Create a ChatGoogleGenerativeAI instance.

    Args:
        temperature: Creativity control
        json_mode: If True, force JSON output format
        model: Model name override (e.g. "gemini-2.5-flash")

    Returns:
        ChatGoogleGenerativeAI instance compatible with LangGraph
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is required for Gemini provider")

    kwargs = {
        "google_api_key": settings.GEMINI_API_KEY,
        "model": model or settings.GEMINI_MODEL,
        "temperature": temperature,
    }

    if json_mode:
        kwargs["response_mime_type"] = "application/json"

    return ChatGoogleGenerativeAI(**kwargs)
