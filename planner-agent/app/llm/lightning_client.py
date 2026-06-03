import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

def create_lightning_llm(
    temperature: float = 0.7,
    json_mode: bool = False,
    model: str = None,
) -> ChatOpenAI:
    """Create a ChatOpenAI instance configured for Lightning AI.
    
    Args:
        temperature: Creativity control
        json_mode: If True, force JSON output format
        model: Model name override
        
    Returns:
        ChatOpenAI instance compatible with LangGraph
    """
    if not settings.LIGHTNING_API_KEY:
        raise ValueError("LIGHTNING_API_KEY is required for Lightning provider")

    # Prepare extra headers for Lightning AI specific requirements
    default_headers = {}
    if settings.LIGHTNING_TEAMSPACE:
        default_headers["X-Lightning-Teamspace"] = settings.LIGHTNING_TEAMSPACE
    if settings.LIGHTNING_USER_ID:
        default_headers["X-Lightning-User-Id"] = settings.LIGHTNING_USER_ID

    # Lightning AI OpenAI-compatible API often requires the "billing path" 
    # in the API key for teamspace billing: KEY/USERNAME/TEAMSPACE
    api_key = settings.LIGHTNING_API_KEY
    if settings.LIGHTNING_TEAMSPACE:
        # If teamspace already contains a slash (e.g. "user/space"), we just append it
        # Otherwise, we might need the username separately, but usually users provide the full path
        api_key = f"{api_key}/{settings.LIGHTNING_TEAMSPACE}"

    return ChatOpenAI(
        model=model or settings.LIGHTNING_MODEL,
        openai_api_key=api_key,
        openai_api_base=settings.LIGHTNING_BASE_URL,
        temperature=temperature,
        # We keep headers as a secondary option
        default_headers=default_headers if default_headers else None,
    )
