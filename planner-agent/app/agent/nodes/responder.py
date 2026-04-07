"""Responder Node — formats the final response.

Takes the agent's work and structures it into the response format:
- response_type: "plan" | "question" | "modification" | "text"
- content: the text response
- plan: the structured plan (if applicable)
- thinking_steps: for collapsible UI
- questions: with suggestions (if applicable)

Also saves messages to the database.
"""

import json
import logging
from app.agent.state import AgentState
from app.db.connection import async_session
from app.db import queries

logger = logging.getLogger(__name__)


def _normalize_content(content) -> str:
    """Normalize LLM content to a plain string.

    Gemini returns content as a list of dicts: [{'type': 'text', 'text': '...'}]
    Ollama/Groq return a plain string. This handles both.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
            elif isinstance(item, str):
                parts.append(item)
        return "\n".join(parts)
    return str(content) if content else ""


async def responder_node(state: AgentState) -> dict:
    """Format and save the final response.

    Determines response type and structures output for the API.
    Saves both user message and assistant response to the database.
    """
    # Determine response type
    if state.get("needs_more_info") and state.get("questions"):
        response_type = "question"
    elif state.get("is_plan_ready") and state.get("current_plan"):
        response_type = "plan" if not state.get("is_modification") else "modification"
    else:
        response_type = "text"

    # Extract final text from last AI message
    final_text = ""
    for msg in reversed(state.get("messages", [])):
        if hasattr(msg, "content") and msg.content and hasattr(msg, "type") and msg.type == "ai":
            final_text = _normalize_content(msg.content)
            break

    # Save assistant message to DB
    try:
        async with async_session() as session:
            metadata = {
                "thinking_steps": state.get("thinking_steps", []),
                "tools_used": state.get("tools_used", []),
            }

            if state.get("current_plan"):
                metadata["has_plan"] = True

            await queries.add_message(
                session,
                state["conversation_id"],
                role="assistant",
                content=final_text,
                message_type=response_type,
                metadata=metadata,
            )

            # Save plan if ready
            if response_type in ("plan", "modification") and state.get("current_plan"):
                await queries.save_plan(
                    session,
                    state["conversation_id"],
                    state["user_id"],
                    state["current_plan"],
                )
    except Exception as e:
        logger.error("Failed to save response to DB: %s", e)

    return {
        "response_type": response_type,
        "final_response": final_text,
        "final_plan": state.get("current_plan"),
        "questions": state.get("questions"),
    }
