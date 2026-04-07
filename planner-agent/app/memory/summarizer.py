"""Conversation summarizer — condenses long conversations.

When a conversation exceeds 15 messages, older messages are summarized
into a structured context to keep the LLM context window manageable.
"""

import json
import logging
from langchain_core.messages import HumanMessage
from app.db.connection import async_session
from app.db import queries
from app.llm.provider import get_llm
from app.config import settings

logger = logging.getLogger(__name__)


async def summarize_if_needed(conversation_id: str) -> dict | None:
    """Check if conversation needs summarization and do it.

    Triggers when message count > CONVERSATION_SUMMARY_THRESHOLD (default 15).

    Returns the summary dict if summarized, None if not needed.
    """
    async with async_session() as session:
        conv = await queries.get_conversation(session, conversation_id)
        if not conv:
            return None

        messages = conv.get("messages", [])

        # Don't summarize short conversations
        if len(messages) <= settings.CONVERSATION_SUMMARY_THRESHOLD:
            return None

        # Already has a recent summary? Only re-summarize if 10+ new messages
        existing_summary = conv.get("contextSummary")
        if existing_summary and len(messages) - existing_summary.get("message_count", 0) < 10:
            return existing_summary

    # Summarize using LLM
    try:
        llm = get_llm(temperature=0.3, json_mode=True)

        # Build conversation text for summarization
        conv_text = "\n".join(
            [f"{m['role']}: {m['content'][:200]}" for m in messages[:-8]]  # Summarize all but recent 8
        )

        prompt = f"""Summarize this travel planning conversation into a structured JSON format.

Conversation:
{conv_text}

Return JSON with these exact fields:
{{
    "trip_overview": "Brief description of the trip being planned",
    "confirmed_preferences": {{"key": "value pairs of confirmed preferences"}},
    "confirmed_constraints": {{"days": null, "budget": null, "adults": null, "children": null}},
    "modifications_made": ["list of changes requested"],
    "important_notes": ["key things to remember about this user"],
    "message_count": {len(messages)}
}}"""

        response = await llm.ainvoke([HumanMessage(content=prompt)])
        summary = json.loads(response.content)
        summary["message_count"] = len(messages)

    except Exception as e:
        logger.warning("Summarization failed: %s", e)
        # Basic fallback summary
        summary = {
            "trip_overview": "Travel planning conversation in progress",
            "confirmed_preferences": {},
            "confirmed_constraints": {},
            "modifications_made": [],
            "important_notes": [],
            "message_count": len(messages),
        }

    # Save summary
    async with async_session() as session:
        await queries.update_conversation_context(session, conversation_id, summary)

    return summary
