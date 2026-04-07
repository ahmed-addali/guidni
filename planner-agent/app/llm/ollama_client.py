"""Ollama local LLM connection via LangChain's ChatOllama.

Supports:
- Tool/function calling (Ollama v0.3+)
- JSON mode
- Configurable temperature and model
"""

from langchain_ollama import ChatOllama
from app.config import settings


def create_ollama_llm(
    temperature: float = 0.7,
    json_mode: bool = False,
    model: str = None,
) -> ChatOllama:
    """Create a ChatOllama instance.

    Args:
        temperature: Creativity control (0.0 = deterministic, 1.0 = creative)
        json_mode: If True, force JSON output format
        model: Model name override

    Returns:
        ChatOllama instance compatible with LangGraph
    """
    kwargs = {
        "base_url": settings.OLLAMA_BASE_URL,
        "model": model or settings.OLLAMA_MODEL,
        "temperature": temperature,
        "num_ctx": 8192,  # Context window
    }

    if json_mode:
        kwargs["format"] = "json"

    return ChatOllama(**kwargs)
