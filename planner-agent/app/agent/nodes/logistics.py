from datetime import datetime
from app.agent.state import AgentState
from app.tools.registry import get_all_tools

async def logistics_node(state: AgentState) -> dict:
    """Pure Python node that calculates logistics like weather, budget, and distance."""
    tools = {t.name: t for t in get_all_tools()}
    get_weather = tools.get("get_weather")
    estimate_daily_budget = tools.get("estimate_daily_budget")
    estimate_trip_budget = tools.get("estimate_trip_budget")
    geocode_address = tools.get("geocode_address")
    get_distance = tools.get("get_distance")
    check_availability = tools.get("check_availability")
    
    prefs = state.get("user_prefs") or {}
    logs = []
    thinking_steps = []
    
    def _track(tool_name, result_summary):
        logs.append({
            "phase": "logistics",
            "node": "logistics_node",
            "tool": tool_name,
            "result": result_summary,
            "timestamp": datetime.now().isoformat()
        })
        thinking_steps.append({
            "step": f"✅ {tool_name} completed",
            "tool_used": tool_name,
            "result_summary": result_summary
        })

    # Weather
    weather = None
    if get_weather and prefs.get("destination") and prefs.get("start_date") and prefs.get("duration"):
        try:
            weather = await get_weather.ainvoke({
                "city": prefs["destination"], 
                "start_date": prefs["start_date"], 
                "duration": prefs["duration"]
            })
            _track("get_weather", "Got weather forecast")
        except Exception:
            pass

    # Budgets
    budget_daily = None
    budget_total = None
    if estimate_daily_budget:
        try:
            budget_daily = await estimate_daily_budget.ainvoke({})
            _track("estimate_daily_budget", "Estimated daily budget")
        except Exception:
            pass
    if estimate_trip_budget:
        try:
            budget_total = await estimate_trip_budget.ainvoke({})
            _track("estimate_trip_budget", "Estimated trip budget")
        except Exception:
            pass
            
    # Distance
    distance = None
    origin = prefs.get("origin")
    dest = prefs.get("destination")
    if origin and dest and geocode_address and get_distance:
        try:
            origin_coords = await geocode_address.ainvoke({"address": origin})
            _track("geocode_address", f"Geocoded {origin}")
            dest_coords = await geocode_address.ainvoke({"address": dest})
            _track("geocode_address", f"Geocoded {dest}")
            
            if "error" not in origin_coords and "error" not in dest_coords:
                distance = await get_distance.ainvoke({
                    "origin_lat": origin_coords["lat"], "origin_lng": origin_coords["lng"],
                    "dest_lat": dest_coords["lat"], "dest_lng": dest_coords["lng"]
                })
                _track("get_distance", "Calculated distance")
        except Exception:
            pass

    # Availability
    availability = None
    rag_context = state.get("rag_context", {})
    stays = rag_context.get("stays", [])
    if check_availability and stays and prefs.get("start_date"):
        try:
            availability = await check_availability.ainvoke({
                "entity_ids": [s.get("entity_id") or s.get("id") for s in stays[:3]], 
                "date": prefs["start_date"]
            })
            _track("check_availability", "Checked availability")
        except Exception:
            pass

    return {
        "weather": weather,
        "budget_estimate": {"daily": budget_daily, "total": budget_total},
        "distance": distance,
        "availability": availability,
        "phase": "logistics",
        "logs": logs,
        "thinking_steps": thinking_steps,
        "last_tool_called": "logistics_batch"
    }
