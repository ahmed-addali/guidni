from datetime import datetime
from app.agent.state import AgentState
from app.tools.registry import get_all_tools

async def ask_user_node(state: AgentState) -> dict:
    """Pure Python node that calls ask_user for missing fields."""
    tools = {t.name: t for t in get_all_tools()}
    ask_user = tools["ask_user"]
    
    prefs = state.get("user_prefs") or {}
    
    missing = []
    questions_to_ask = []
    has_dest = prefs.get("destination_id") or prefs.get("destination_city") or prefs.get("destination")
    if not has_dest:
        missing.append("destination")
        questions_to_ask.append({"question": "Where would you like to go?", "suggestions": ["Djerba", "Tunis"]})
    if not prefs.get("start_date"):
        missing.append("start_date")
        questions_to_ask.append({"question": "When are you planning to travel? (YYYY-MM-DD)", "suggestions": []})
    if not prefs.get("duration"):
        missing.append("duration")
        questions_to_ask.append({"question": "How many days will you be staying?", "suggestions": ["3 days", "5 days", "7 days"]})
        
    result = await ask_user.ainvoke({"questions": questions_to_ask})
    
    log_entry = {
        "phase": "ask_user",
        "node": "ask_user_node",
        "tool": "ask_user",
        "result": f"Asked for {missing}",
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "needs_more_info": True,
        "questions": result.get("questions", []),
        "response_type": "question",
        "logs": [log_entry],
        "thinking_steps": [{"step": "❓ Asking for missing info", "tool_used": "ask_user", "result_summary": "Missing info"}],
        "last_tool_called": "ask_user"
    }
