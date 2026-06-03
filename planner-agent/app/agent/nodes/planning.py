import json
import re
import logging
from datetime import datetime
from app.agent.state import AgentState
from app.tools.registry import get_all_tools
from app.llm.provider import get_llm
from langchain_core.messages import SystemMessage

logger = logging.getLogger(__name__)


def _parse_selected_ids(query: str) -> list[str]:
    """Extract selected_slot_ids from the user's modification message."""
    match = re.search(r'\[selected_slot_ids:\s*(.+?)\]', query)
    if match:
        return [sid.strip() for sid in match.group(1).split(",") if sid.strip()]
    return []


def _find_slot_type(plan: dict, slot_id: str) -> str | None:
    """Find the type of a slot by its activity_id in the plan."""
    for day in plan.get("days", []):
        for slot in day.get("slots", []):
            if slot.get("activity_id") == slot_id:
                return slot.get("type", "activity")
    return None


def _get_candidates_by_type(rag_context: dict, slot_type: str, exclude_ids: set) -> list[dict]:
    """Get replacement candidates from RAG context matching the slot type."""
    # Map slot types to RAG context keys
    type_to_keys = {
        "activity": ["activities"],
        "restaurant": ["restaurants"],
        "attraction": ["attractions"],
        "stay_suggestion": ["stays"],
        "accommodation": ["stays"],
        "meal": ["restaurants"],
    }
    keys = type_to_keys.get(slot_type, ["activities", "attractions"])
    
    candidates = []
    for key in keys:
        for item in rag_context.get(key, []):
            eid = item.get("entity_id") or item.get("id")
            if eid and eid not in exclude_ids:
                candidates.append(item)
    return candidates


def _build_replacement_slot(old_slot: dict, candidate: dict) -> dict:
    """Build a replacement slot from a RAG candidate, keeping the old slot's time/day position."""
    new_slot = dict(old_slot)  # Copy time, day position, etc.
    new_slot["activity_id"] = candidate.get("entity_id") or candidate.get("id")
    new_slot["title"] = candidate.get("title") or candidate.get("name") or old_slot["title"]
    new_slot["description"] = (candidate.get("snippet") or str(candidate.get("description", "")))[:200]
    new_slot["price"] = candidate.get("price", old_slot.get("price", 0))
    new_slot["image"] = None  # Will be filled by create_plan_structure
    new_slot["latitude"] = None  # Will be filled by create_plan_structure
    new_slot["longitude"] = None  # Will be filled by create_plan_structure
    new_slot["reason"] = f"Replaced as requested — {new_slot['title']}"
    return new_slot


def _apply_modifications(plan: dict, selected_ids: list[str], rag_context: dict) -> tuple[dict, list[str]]:
    """Apply slot replacements deterministically. Returns (modified_plan, swap_log)."""
    # Collect all IDs currently in the plan to avoid duplicates
    all_plan_ids = set()
    for day in plan.get("days", []):
        for slot in day.get("slots", []):
            aid = slot.get("activity_id")
            if aid:
                all_plan_ids.add(aid)
    
    swap_log = []
    for sid in selected_ids:
        slot_type = _find_slot_type(plan, sid)
        if not slot_type:
            swap_log.append(f"⚠ ID {sid} not found in plan")
            continue
        
        # Find candidates (exclude current plan IDs + already-selected IDs)
        exclude = all_plan_ids | set(selected_ids)
        candidates = _get_candidates_by_type(rag_context, slot_type, exclude)
        
        if not candidates:
            swap_log.append(f"⚠ No replacement found for {sid} (type={slot_type})")
            continue
        
        # Pick the best candidate (first = highest ranked by RAG)
        replacement = candidates[0]
        new_id = replacement.get("entity_id") or replacement.get("id")
        
        # Find and replace the slot in the plan
        for day in plan.get("days", []):
            for i, slot in enumerate(day.get("slots", [])):
                if slot.get("activity_id") == sid:
                    new_slot = _build_replacement_slot(slot, replacement)
                    day["slots"][i] = new_slot
                    all_plan_ids.discard(sid)
                    all_plan_ids.add(new_id)
                    swap_log.append(f"✅ Swapped {slot.get('title', sid)} → {new_slot['title']}")
                    break
    
    return plan, swap_log


def build_planning_prompt(user_prefs, rag_context, weather, budget, validation_error):
    """Build the system prompt for new plan creation (LLM-based)."""
    parts = ["You are an expert travel planner. Create a detailed day-by-day plan."]
    parts.append("For EVERY slot you MUST provide: a meaningful 'reason' (why this fits the traveler), and a 'description' (what the traveler will experience).")
    if user_prefs:
        parts.append(f"## Preferences\n{json.dumps(user_prefs, default=str)}")
    if weather:
        parts.append(f"## Weather\n{json.dumps(weather, default=str)}")
    if budget:
        parts.append(f"## Budget\n{json.dumps(budget, default=str)}")
    if rag_context:
        # Pass minimal info to save tokens
        ctx_compact = {}
        for k, v_list in rag_context.items():
            if v_list:
                ctx_compact[k] = [
                    {"id": item.get("entity_id") or item.get("id"), 
                     "title": item.get("title") or item.get("name"), 
                     "price": item.get("price"),
                     "type": item.get("entity_type", k.rstrip("s")),
                     "description": item.get("snippet") or str(item.get("description", ""))[:150]}
                    for item in v_list
                ]
        parts.append(f"## Available Candidates\nUSE ONLY THESE IDs:\n{json.dumps(ctx_compact, default=str)}")
        
    if validation_error:
        parts.append(f"## CRITICAL ERROR FROM PREVIOUS ATTEMPT\n{validation_error}\nYou MUST fix this error by using ONLY the real IDs provided in 'Available Candidates'.")
        
    parts.append("Your response MUST trigger the create_plan_structure tool with the final plan.")
    return "\n\n".join(parts)


async def planning_node(state: AgentState) -> dict:
    tools = {t.name: t for t in get_all_tools()}
    create_plan_structure = tools.get("create_plan_structure")
    
    logs = []
    thinking_steps = []
    
    def _track(tool_name, result_summary):
        logs.append({
            "phase": "planning",
            "node": "planning_node",
            "tool": tool_name,
            "result": result_summary,
            "timestamp": datetime.now().isoformat()
        })
        thinking_steps.append({
            "step": f"📝 {tool_name}",
            "tool_used": tool_name,
            "result_summary": result_summary
        })

    current_plan = state.get("current_plan")
    query = state.get("query", "")
    rag_context = state.get("rag_context") or {}

    # ─── MODIFICATION PATH: Deterministic swap (no LLM) ─────────
    selected_ids = _parse_selected_ids(query)
    if current_plan and selected_ids:
        logger.info("Planning node: MODIFY mode — swapping %d slots", len(selected_ids))
        
        # Deep-copy the plan to avoid mutating state
        plan_copy = json.loads(json.dumps(current_plan))
        modified_plan, swap_log = _apply_modifications(plan_copy, selected_ids, rag_context)
        
        for entry in swap_log:
            _track("modify_plan", entry)
        
        # Run through create_plan_structure for coordinate/image enrichment
        if create_plan_structure:
            try:
                from app.schemas.plan import FullPlan
                enriched = await create_plan_structure.ainvoke({"plan": FullPlan(**modified_plan)})
                if isinstance(enriched, dict) and enriched.get("plan"):
                    modified_plan = enriched["plan"]
                    _track("create_plan_structure", "Enriched modified plan with coordinates & images")
            except Exception as e:
                logger.warning("Enrichment failed for modified plan: %s", e)
                _track("create_plan_structure", f"Enrichment warning: {e}")
        
        return {
            "current_plan": modified_plan,
            "final_plan": modified_plan,
            "last_tool_called": "modify_plan",
            "phase": "planning",
            "logs": logs,
            "thinking_steps": thinking_steps,
            "response_type": "plan",
            "is_plan_ready": True,
        }

    # ─── NEW PLAN PATH: LLM generates from scratch ──────────────
    logger.info("Planning node: CREATE mode — generating new plan via LLM")
    prompt = build_planning_prompt(
        user_prefs=state.get("user_prefs"),
        rag_context=rag_context,
        weather=state.get("weather"),
        budget=state.get("budget_estimate"),
        validation_error=state.get("validation_error"),
    )
    
    llm = get_llm(
        temperature=0.2,
        provider=state.get("llm_provider"),
        model=state.get("llm_model"),
    )
    
    llm_with_tools = llm.bind_tools([create_plan_structure], tool_choice="create_plan_structure")
    
    result_msg = await llm_with_tools.ainvoke([SystemMessage(content=prompt)])
    
    plan_result = None
    if result_msg.tool_calls:
        args = result_msg.tool_calls[0].get("args", {})
        try:
            plan_result = await create_plan_structure.ainvoke(args)
            _track("create_plan_structure", "Drafted new plan")
        except Exception as e:
            plan_result = {"valid": False, "error": str(e)}
            _track("create_plan_structure", f"Error drafting plan: {e}")
            
    current_retry = state.get("retry_count", 0)
            
    return {
        "current_plan": plan_result.get("plan") if isinstance(plan_result, dict) else None,
        "last_tool_called": "create_plan_structure",
        "retry_count": current_retry,
        "phase": "planning",
        "logs": logs,
        "thinking_steps": thinking_steps,
        "response_type": "plan"
    }
