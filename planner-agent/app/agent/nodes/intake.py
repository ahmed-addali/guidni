import json
from datetime import datetime
from app.agent.state import AgentState
from app.tools.registry import get_all_tools
from app.llm.provider import get_llm
from app.schemas.requests import UserPreferences
from langchain_core.messages import SystemMessage, HumanMessage

async def intake_node(state: AgentState) -> dict:
    """Intake node: calls get_user_profile and uses LLM to extract preferences."""
    
    # 1. Get user profile
    tools = {t.name: t for t in get_all_tools()}
    get_user_profile = tools["get_user_profile"]
    update_preferences = tools["update_preferences"]
    
    # Get user id
    user_id = state.get("user_id")
    profile = await get_user_profile.ainvoke({"user_id": user_id})
    
    # 2. Extract preferences using LLM
    query = state.get("query", "")
    llm = get_llm(
        temperature=0.1,
        provider=state.get("llm_provider"),
        model=state.get("llm_model"),
    )
    
    # Force the LLM to call update_preferences
    llm_with_tools = llm.bind_tools([update_preferences], tool_choice="update_preferences")
    
    sys_prompt = SystemMessage(content=
        "You are an intent extraction agent. Your ONLY job is to extract trip preferences from the user's message "
        "and call the update_preferences tool. Do not respond with text.\n"
        f"Existing Profile Context:\n{json.dumps(profile, default=str)}"
    )
    human_msg = HumanMessage(content=f"Extract preferences from this query: {query}")
    
    result = await llm_with_tools.ainvoke([sys_prompt, human_msg])
    
    pref_updates = {}
    if result.tool_calls:
        tool_call = result.tool_calls[0]
        args = tool_call.get("args", {})
        
        # 3. Call update_preferences to save them
        tool_result = await update_preferences.ainvoke(args)
        
        if isinstance(tool_result, dict):
            pref_updates = tool_result.get("preference_updates", {})
    
    # Update local state
    current_prefs = dict(state.get("user_prefs") or {})
    current_prefs.update(pref_updates)
    
    log_entry = {
        "phase": "intake",
        "node": "intake_node",
        "tool": "update_preferences",
        "result": f"Extracted {list(pref_updates.keys())}",
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "user_profile": profile,
        "user_prefs": current_prefs,
        "phase": "intake",
        "logs": [log_entry],
        "thinking_steps": [{"step": "👤 Extracted preferences", "tool_used": "update_preferences", "result_summary": "Extracted preferences"}],
        "last_tool_called": "update_preferences"
    }
