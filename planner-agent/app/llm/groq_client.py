"""Groq cloud fallback LLM via LangChain's ChatGroq.

Used when Ollama is unavailable or for fast development/testing.
Same interface as Ollama — swap with one config change.
"""

from langchain_groq import ChatGroq
from app.config import settings


def create_groq_llm(
    temperature: float = 0.7,
    json_mode: bool = False,
    model: str = None,
) -> ChatGroq:
    """Create a ChatGroq instance.

    Args:
        temperature: Creativity control
        json_mode: If True, force JSON output format
        model: Model name override

    Returns:
        ChatGroq instance compatible with LangGraph
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is required for Groq provider")

    kwargs = {
        "api_key": settings.GROQ_API_KEY,
        "model_name": model or settings.GROQ_MODEL,
        "temperature": temperature,
    }

    if json_mode:
        kwargs["model_kwargs"] = {"response_format": {"type": "json_object"}}

    return ChatGroq(**kwargs)
