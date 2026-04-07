"""LLM Provider abstraction — switch between Ollama, Groq, and Gemini.

Supports per-request model override via provider/model parameters.

Model ID format: "provider/model_name"
  e.g. "ollama/qwen2.5:7b", "gemini/gemini-2.5-flash", "groq/moonshotai/kimi-k2-instruct"
"""

import logging
from langchain_core.language_models import BaseChatModel
from app.config import settings

logger = logging.getLogger(__name__)

# ===== Curated model list (shown in frontend) =====
AVAILABLE_MODELS = [
    {
        "id": "ollama/qwen2.5:7b",
        "name": "Qwen 2.5 7B",
        "provider": "ollama",
        "model": "qwen2.5:7b",
        "type": "local",
        "description": "Fast local model — runs on your machine",
    },
    {
        "id": "ollama/qwen3.5:4b",
        "name": "Qwen 3.5 4B",
        "provider": "ollama",
        "model": "qwen3.5:4b",
        "type": "local",
        "description": "Fast local model — runs on your machine",
    },
    {
        "id": "ollama/qwen3.5:9b",
        "name": "Qwen 3.5 9B",
        "provider": "ollama",
        "model": "qwen3.5:9b",
        "type": "local",
        "description": "Fast local model — runs on your machine",
    },
    {
        "id": "ollama/qwen3:8b",
        "name": "Qwen 3 8B",
        "provider": "ollama",
        "model": "qwen3:8b",
        "type": "local",
        "description": "Fast local model — runs on your machine",
    },
    {
        "id": "groq/llama-3.3-70b-versatile",
        "name": "Llama 3.3 70B",
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "type": "cloud",
        "description": "Groq cloud — fast inference, free tier",
    },
    {
        "id": "gemini/gemini-2.0-flash",
        "name": "Gemini 2.0 Flash",
        "provider": "gemini",
        "model": "gemini-2.0-flash",
        "type": "cloud",
        "description": "Google Gemini — fast and capable",
    },
    {
        "id": "groq/moonshotai/kimi-k2-instruct",
        "name": "Kimi K2 Instruct",
        "provider": "groq",
        "model": "moonshotai/kimi-k2-instruct",
        "type": "cloud",
        "description": "Moonshot AI via Groq — advanced reasoning",
    },
    {
        "id": "gemini/gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "type": "cloud",
        "description": "Google Gemini 2.5 — latest generation",
    },
    {
        "id": "gemini/gemini-2.5-flash-lite",
        "name": "Gemini 2.5 Flash Lite",
        "provider": "gemini",
        "model": "gemini-2.5-flash-lite",
        "type": "cloud",
        "description": "Google Gemini 2.5 Lite — lightweight & fast",
    },
]


def parse_model_id(model_id: str) -> tuple[str, str]:
    """Parse 'provider/model' string into (provider, model_name).
    
    Handles special cases like 'groq/moonshotai/kimi-k2-instruct'
    where the model name itself contains a '/'.
    """
    parts = model_id.split("/", 1)
    if len(parts) != 2:
        raise ValueError(f"Invalid model ID: '{model_id}'. Expected format: 'provider/model_name'")
    
    provider = parts[0]
    model_name = parts[1]
    return provider, model_name


def get_llm(
    temperature: float = 0.7,
    json_mode: bool = False,
    provider: str = None,
    model: str = None,
) -> BaseChatModel:
    """Get an LLM instance.

    Args:
        temperature: Creativity control (0.0 = deterministic, 1.0 = creative)
        json_mode: If True, force JSON output format
        provider: Provider override (e.g. "ollama", "groq", "gemini")
        model: Model name override (e.g. "qwen2.5:7b", "gemini-2.5-flash")

    Returns:
        LangChain chat model instance compatible with LangGraph
    """
    active_provider = (provider or settings.LLM_PROVIDER).lower()

    if active_provider == "ollama":
        return _get_ollama(temperature=temperature, json_mode=json_mode, model=model)
    elif active_provider == "groq":
        return _get_groq(temperature=temperature, json_mode=json_mode, model=model)
    elif active_provider == "gemini":
        return _get_gemini(temperature=temperature, json_mode=json_mode, model=model)
    else:
        raise ValueError(
            f"Unknown LLM provider: '{active_provider}'. "
            f"Use 'ollama', 'groq', or 'gemini'."
        )


def get_available_models() -> list[dict]:
    """Return the curated list of available models with availability status."""
    models = []
    for m in AVAILABLE_MODELS:
        available = _check_provider_configured(m["provider"])
        models.append({**m, "available": available})
    return models


def _check_provider_configured(provider: str) -> bool:
    """Check if a provider has the required configuration."""
    if provider == "ollama":
        return True  # Ollama doesn't need an API key
    elif provider == "groq":
        return bool(settings.GROQ_API_KEY)
    elif provider == "gemini":
        return bool(settings.GEMINI_API_KEY)
    return False


def _get_ollama(temperature: float, json_mode: bool, model: str = None) -> BaseChatModel:
    """Create Ollama client."""
    from app.llm.ollama_client import create_ollama_llm
    return create_ollama_llm(temperature=temperature, json_mode=json_mode, model=model)


def _get_groq(temperature: float, json_mode: bool, model: str = None) -> BaseChatModel:
    """Create Groq client."""
    from app.llm.groq_client import create_groq_llm
    return create_groq_llm(temperature=temperature, json_mode=json_mode, model=model)


def _get_gemini(temperature: float, json_mode: bool, model: str = None) -> BaseChatModel:
    """Create Gemini client."""
    from app.llm.gemini_client import create_gemini_llm
    return create_gemini_llm(temperature=temperature, json_mode=json_mode, model=model)
