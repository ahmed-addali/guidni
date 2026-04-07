"""Conversation memory management.

Handles loading and updating conversation context so the agent
maintains coherence across multiple interactions.
"""

import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.db.connection import async_session
from app.db import queries

logger = logging.getLogger(__name__)


async def load_context(conversation_id: str) -> dict:
    """Load conversation context for the agent.

    Returns:
        - context_summary: structured summary of the conversation
        - recent_messages: last 8 messages as LangChain messages
        - current_plan: the active plan (if exists)
    """
    async with async_session() as session:
        conv = await queries.get_conversation(session, conversation_id)
        if not conv:
            return {
                "context_summary": None,
                "recent_messages": [],
                "current_plan": None,
            }

        # Convert DB messages to LangChain format
        messages = conv.get("messages", [])
        recent_messages = messages[-8:]  # Last 8 messages

        langchain_messages = []
        for msg in recent_messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                langchain_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                langchain_messages.append(AIMessage(content=content))
            elif role == "system":
                langchain_messages.append(SystemMessage(content=content))

        # Get current plan
        plan = await queries.get_current_plan(session, conversation_id)

    return {
        "context_summary": conv.get("contextSummary"),
        "recent_messages": langchain_messages,
        "current_plan": plan.get("planData") if plan else None,
    }


async def update_context(conversation_id: str, agent_state: dict) -> None:
    """Update conversation context after an interaction.

    Saves a structured summary of what's been discussed so far.
    """
    context = {
        "tools_used_total": agent_state.get("tools_used", []),
        "has_plan": agent_state.get("current_plan") is not None,
        "response_type": agent_state.get("response_type", "text"),
    }

    # Add user profile insights if available
    if agent_state.get("user_profile"):
        profile = agent_state["user_profile"]
        context["user_insights"] = {
            "favorite_categories": profile.get("favorite_categories", []),
            "average_spend": profile.get("average_spend", 0),
            "wishlist_count": len(profile.get("wishlist_items", [])),
        }

    async with async_session() as session:
        await queries.update_conversation_context(session, conversation_id, context)
