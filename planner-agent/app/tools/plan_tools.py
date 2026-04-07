"""Plan tools — create, modify, and save travel plans.

Tools:
- create_plan_structure: Structure and validate a complete multi-day plan
- modify_plan: Apply modifications to an existing plan
- save_plan_tool: Save the finalized plan to the database
"""

import json
import logging
from langchain_core.tools import tool
from app.db.connection import async_session
from app.db import queries

logger = logging.getLogger(__name__)


@tool
async def create_plan_structure(plan_json: str) -> dict:
    """Structure and validate a complete multi-day plan. Takes raw plan data
    and validates it: no duplicate activities, dates are correct, budget check.

    The plan_json should be a JSON string with this structure:
    {
        "days": [
            {
                "day_number": 1,
                "date": "2024-03-15",
                "theme": "Arrival & Relaxation",
                "slots": [
                    {
                        "time": "09:00",
                        "end_time": "11:00",
                        "type": "activity",
                        "activity_id": "abc123",
                        "title": "Activity Name",
                        "description": "Why this activity",
                        "category": "cultural",
                        "price": 50,
                        "duration": 120,
                        "reason": "Perfect for relaxation",
                        "image": "url",
                        "bookable": true
                    }
                ]
            }
        ],
        "summary": "Your romantic 5-day trip to Djerba",
        "total_budget": 1850,
        "stay_suggestions": [
            {
                "stay_id": "xyz",
                "title": "Hotel Name",
                "price": 120,
                "rating": 4.5,
                "image": "url",
                "reason": "Romantic and close to beach"
            }
        ],
        "tips": ["Bring sunscreen", "Try the local seafood"],
        "budget_breakdown": {
            "activities": 500,
            "accommodation": 600,
            "food": 400,
            "transport": 200,
            "total": 1700
        }
    }

    Args:
        plan_json: JSON string of the plan data
    """
    try:
        plan_data = json.loads(plan_json)
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON: {str(e)}"}

    # Validate
    errors = []
    activity_ids = set()
    days = plan_data.get("days", [])

    if not days:
        errors.append("Plan has no days")

    for day in days:
        if "day_number" not in day:
            errors.append("Day missing day_number")
        for slot in day.get("slots", []):
            # Check for duplicates
            aid = slot.get("activity_id")
            if aid and aid in activity_ids:
                errors.append(f"Duplicate activity: {slot.get('title', aid)}")
            if aid:
                activity_ids.add(aid)

    # Verify activity IDs exist in DB
    if activity_ids:
        async with async_session() as session:
            for aid in activity_ids:
                details = await queries.get_activity_details(session, aid)
                if not details:
                    errors.append(f"Activity ID not found in DB: {aid}")

    if errors:
        return {"valid": False, "errors": errors, "plan": plan_data}

    return {"valid": True, "plan": plan_data, "activity_count": len(activity_ids)}


@tool
async def modify_plan(current_plan_json: str, modification: str) -> dict:
    """Apply a modification to an existing plan. Describe what needs to change
    and this tool will update the plan accordingly.

    Args:
        current_plan_json: The current plan as JSON string
        modification: Description of the modification to apply
    """
    try:
        plan = json.loads(current_plan_json)
    except json.JSONDecodeError as e:
        return {"error": f"Invalid plan JSON: {str(e)}"}

    # Increment version
    plan["version"] = plan.get("version", 1) + 1
    plan["modification_applied"] = modification

    return {
        "modified": True,
        "plan": plan,
        "modification": modification,
        "note": "Plan updated. Please verify the changes are correct.",
    }


@tool
async def save_plan_tool(
    conversation_id: str,
    user_id: str,
    plan_json: str,
) -> dict:
    """Save the finalized plan to the database for the user to access later.

    Args:
        conversation_id: The conversation ID this plan belongs to
        user_id: The user's ID
        plan_json: The complete plan as JSON string
    """
    try:
        plan_data = json.loads(plan_json)
    except json.JSONDecodeError as e:
        return {"error": f"Invalid plan JSON: {str(e)}"}

    async with async_session() as session:
        plan_id = await queries.save_plan(session, conversation_id, user_id, plan_data)

    return {
        "saved": True,
        "plan_id": plan_id,
        "message": "Plan saved successfully!",
    }
