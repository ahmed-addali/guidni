from datetime import datetime
from app.agent.state import AgentState
from app.tools.registry import get_all_tools

async def research_node(state: AgentState) -> dict:
    """Pure Python node that calls search and enrichment tools once."""
    tools = {t.name: t for t in get_all_tools()}
    rag_search = tools.get("rag_search")
    enrich_activity = tools.get("enrich_activity")
    get_activity_details = tools.get("get_activity_details")
    
    prefs = state.get("user_prefs") or {}
    query = state.get("query", prefs.get("destination", "Djerba"))
    
    logs = []
    thinking_steps = []
    
    def _track(tool_name, result_summary):
        logs.append({
            "phase": "research",
            "node": "research_node",
            "tool": tool_name,
            "result": result_summary,
            "timestamp": datetime.now().isoformat()
        })
        thinking_steps.append({
            "step": f"✅ {tool_name} completed",
            "tool_used": tool_name,
            "result_summary": result_summary
        })

    # Execute search using the comprehensive rag_search_for_plan tool
    rag_search_for_plan = tools.get("rag_search_for_plan")
    
    activities, stays, restaurants, attractions = [], [], [], []
    if rag_search_for_plan:
        try:
            results = await rag_search_for_plan.ainvoke({
                "query": query,
                "num_days": prefs.get("duration", 3),
                "destination_id": prefs.get("destination_id"),
                "budget": prefs.get("budget"),
                "group_type": prefs.get("group_type"),
                "interests": prefs.get("interests", [])
            })
            if isinstance(results, dict):
                activities = results.get("activities_for_time_slots", [])
                stays = results.get("stays_for_overnight_only", [])
                restaurants = results.get("restaurants_for_meals", [])
                attractions = results.get("attractions_for_time_slots", [])
                
                _track("rag_search_for_plan", f"Found {len(activities)} acts, {len(stays)} stays, {len(restaurants)} rests, {len(attractions)} attr")
        except Exception as e:
            _track("rag_search_for_plan", f"Error: {e}")

    acts_list = activities if isinstance(activities, list) else []
    attr_list = attractions if isinstance(attractions, list) else []

    # Enrich top results only
    for item in acts_list[:3]:
        entity_id = item.get("entity_id") or item.get("id")
        if entity_id and enrich_activity:
            try:
                await enrich_activity.ainvoke({
                    "activity_id": entity_id,
                    "provider": state.get("llm_provider"),
                    "model": state.get("llm_model")
                })
                _track("enrich_activity", f"Enriched {entity_id}")
            except Exception:
                pass

    # Get details for top candidates
    combined = acts_list + attr_list
    for item in combined[:5]:
        entity_id = item.get("entity_id") or item.get("id")
        if entity_id and get_activity_details:
            try:
                await get_activity_details.ainvoke({"activity_id": entity_id})
                _track("get_activity_details", f"Got details for {entity_id}")
            except Exception:
                pass

    rag_context = {
        "activities": acts_list,
        "stays": stays if isinstance(stays, list) else [],
        "restaurants": restaurants if isinstance(restaurants, list) else [],
        "attractions": attr_list
    }

    return {
        "rag_context": rag_context,
        "phase": "research",
        "logs": logs,
        "thinking_steps": thinking_steps,
        "last_tool_called": "rag_search"
    }
