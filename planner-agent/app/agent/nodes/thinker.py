"""Thinker Node — the agent's reasoning engine.

This node receives the full state and uses the LLM to:
1. Analyze the current situation
2. Decide what to do next (use a tool, respond, or ask user)
3. Record a thinking step for the collapsible UI
"""

import json
import logging
from langchain_core.messages import SystemMessage, AIMessage
from app.agent.state import AgentState
from app.agent.personality import get_system_prompt
from app.llm.provider import get_llm
from app.tools.registry import get_all_tools

logger = logging.getLogger(__name__)


def _get_text_content(content) -> str:
    """Normalize LLM response content to a plain string.

    Different providers return content in different formats:
    - Ollama/Groq: plain string
    - Gemini: list of dicts like [{'type': 'text', 'text': '...', 'extras': {...}}]
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


async def thinker_node(state: AgentState) -> dict:
    """The reasoning node — calls LLM with tools to decide next action.

    The LLM sees:
    - System personality prompt
    - All conversation messages
    - Available tools with descriptions
    - Current context (user profile, gathered data)

    It decides:
    - Which tool to call (if any)
    - What arguments to use
    - Or to respond directly
    """
    # Build context message with gathered data
    context_parts = []
    if state.get("user_profile"):
        context_parts.append(f"User Profile: {state['user_profile']}")
    if state.get("current_plan"):
        context_parts.append(f"Current Plan (version {state['current_plan'].get('version', 1)}): exists with {len(state['current_plan'].get('days', []))} days")
    if state.get("weather"):
        context_parts.append(f"Weather Data: {state['weather']}")
    if state.get("rag_context"):
        rag_summary = [f"- {r['title']} ({r['entity_type']}, score: {r['score']})" for r in state['rag_context'][:5]]
        context_parts.append(f"RAG Search Results:\n" + "\n".join(rag_summary))

    context_msg = "\n".join(context_parts)

    # Prepare messages
    messages = [SystemMessage(content=get_system_prompt())]
    if context_msg:
        messages.append(SystemMessage(content=f"## Current Context\n{context_msg}"))

    # Add conversation history
    messages.extend(state["messages"])

    # Force the LLM to stop searching and respond if we have enough data
    iteration = state.get("iteration_count", 0)
    if iteration >= 2 and state.get("rag_context"):
        messages.append(SystemMessage(
            content="IMPORTANT: You already have enough data from previous searches. "
                    "Generate your FINAL response now using the data you have. "
                    "Do NOT call any more search tools. Respond directly to the user."
        ))

    # Get LLM with tools bound (use per-request model if specified)
    llm = get_llm(
        temperature=0.1,
        provider=state.get("llm_provider"),
        model=state.get("llm_model"),
    )
    tools = get_all_tools()
    llm_with_tools = llm.bind_tools(tools)

    # === DETAILED LOGGING: LLM INPUT ===
    logger.debug("=" * 80)
    logger.debug("LLM INPUT — Iteration %d", iteration + 1)
    logger.debug("=" * 80)
    for i, msg in enumerate(messages):
        role = msg.__class__.__name__
        content = msg.content if hasattr(msg, "content") else str(msg)
        logger.debug("[Message %d] %s:\n%s", i, role, content[:2000])
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            logger.debug("  Tool calls: %s", msg.tool_calls)
    logger.debug("-" * 80)

    # Invoke LLM
    response = await llm_with_tools.ainvoke(messages)

    # === DETAILED LOGGING: LLM OUTPUT ===
    logger.debug("=" * 80)
    logger.debug("LLM OUTPUT — Iteration %d", iteration + 1)
    logger.debug("=" * 80)
    if response.content:
        text_content = _get_text_content(response.content)
        logger.debug("Content:\n%s", text_content)
        logger.info("   💬 LLM response: %s", text_content[:200] + ("..." if len(text_content) > 200 else ""))
    if response.tool_calls:
        for tc in response.tool_calls:
            logger.debug("Tool Call: %s(%s)", tc["name"], json.dumps(tc["args"], default=str, ensure_ascii=False))
            logger.info("   🔧 LLM wants to call: %s(%s)", tc["name"], json.dumps(tc["args"], default=str, ensure_ascii=False)[:200])
    if not response.content and not response.tool_calls:
        logger.debug("Empty response (no content, no tool calls)")
    logger.debug("-" * 80)

    # Track thinking step
    thinking_step = {
        "step": _extract_thinking(response),
        "tool_used": None,
        "result_summary": None,
    }

    # Check if LLM wants to call a tool
    if response.tool_calls:
        tool_call = response.tool_calls[0]
        thinking_step["tool_used"] = tool_call["name"]

    return {
        "messages": [response],
        "thinking_steps": [thinking_step],
        "iteration_count": iteration + 1,
    }


def _extract_thinking(response: AIMessage) -> str:
    """Extract a human-readable thinking step from the LLM response."""
    if response.content:
        text = _get_text_content(response.content)
        if len(text) > 150:
            text = text[:150] + "..."
        return text

    if response.tool_calls:
        tool_name = response.tool_calls[0]["name"]
        tool_descriptions = {
            "get_user_profile": "👤 Checking your profile and preferences...",
            "search_activities": "🔍 Searching for activities...",
            "get_activity_details": "📋 Getting activity details...",
            "enrich_activity": "🏷️ Analyzing activity characteristics...",
            "get_weather": "🌤️ Checking weather forecast...",
            "get_distance": "📍 Calculating distances...",
            "geocode_address": "📍 Finding location coordinates...",
            "search_stays": "🏨 Searching for accommodation...",
            "search_restaurants": "🍽️ Finding dining options...",
            "check_availability": "📅 Checking availability...",
            "estimate_daily_budget": "💰 Calculating daily budget...",
            "estimate_trip_budget": "💰 Estimating total trip budget...",
            "create_plan_structure": "📝 Building your plan...",
            "modify_plan": "✏️ Modifying the plan...",
            "save_plan_tool": "💾 Saving the plan...",
            "ask_user": "❓ Need to ask you something...",
            "rag_search": "🧠 Semantic search for relevant places...",
            "rag_search_for_plan": "🧠 Searching for themed activities and dining...",
            "rag_get_similar": "🧠 Finding similar alternatives...",
        }
        return tool_descriptions.get(tool_name, f"🔧 Using {tool_name}...")

    return "🤔 Thinking..."
