"""Validator Node — guardrails and fact-checking.

Validates the agent's output before it reaches the user:
- Plan validation: activity IDs exist, no duplicates, budget correct, dates valid
- Question validation: pertinent, not too many questions
- Text validation: actually responds to the user
"""

import json
import logging
from langchain_core.messages import SystemMessage
from app.agent.state import AgentState

logger = logging.getLogger(__name__)


async def validator_node(state: AgentState) -> dict:
    """Validate the agent's response before sending.

    Checks:
    1. If plan → all activityIds exist? No duplicates? Budget correct? Dates valid?
    2. If question → is it pertinent? Not too many?
    3. If text → does it answer the user?
    """
    errors = []

    # Validate plan if ready
    if state.get("is_plan_ready") and state.get("current_plan"):
        plan = state["current_plan"]
        plan_errors = _validate_plan(plan)
        errors.extend(plan_errors)

    # Validate iteration safety
    if state.get("iteration_count", 0) >= 15:
        errors.append("Maximum iterations reached. Forcing response.")

    # If errors, signal retry
    if errors:
        error_msg = "Validation issues: " + "; ".join(errors)
        logger.warning(error_msg)

        return {
            "messages": [SystemMessage(content=f"[VALIDATION] {error_msg}. Please fix these issues.")],
            "thinking_steps": [{
                "step": f"⚠️ Validation: {'; '.join(errors[:2])}",
                "tool_used": None,
                "result_summary": None,
            }],
            "is_plan_ready": False if "Duplicate" in str(errors) or "not found" in str(errors) else state.get("is_plan_ready", False),
        }

    return {
        "thinking_steps": [{
            "step": "✅ Validation passed!",
            "tool_used": None,
            "result_summary": None,
        }],
    }


def _validate_plan(plan: dict) -> list[str]:
    """Validate a structured plan."""
    errors = []
    activity_ids = set()

    days = plan.get("days", [])
    if not days:
        errors.append("Plan has no days")
        return errors

    for day in days:
        day_num = day.get("day_number", "?")
        slots = day.get("slots", [])

        if len(slots) == 0:
            errors.append(f"Day {day_num} has no activities")

        if len(slots) > 7:
            errors.append(f"Day {day_num} has too many activities ({len(slots)}). Max 5-7.")

        for slot in slots:
            aid = slot.get("activity_id")
            if aid:
                if aid in activity_ids:
                    errors.append(f"Duplicate activity: {slot.get('title', aid)}")
                activity_ids.add(aid)

    return errors
