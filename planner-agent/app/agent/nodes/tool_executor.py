"""Tool Executor Node — executes the tool chosen by the thinker.

Takes the tool call from the last AI message, executes it,
and returns the result as a ToolMessage.
"""

import json
import logging
from langchain_core.messages import ToolMessage
from app.agent.state import AgentState
from app.tools.registry import get_all_tools

logger = logging.getLogger(__name__)


async def tool_executor_node(state: AgentState) -> dict:
    """Execute the tool call from the last AI message.

    Finds the tool by name, runs it with the provided arguments,
    and returns the result as a ToolMessage for the LLM to process.
    """
    # Get the last message (should be AIMessage with tool_calls)
    last_message = state["messages"][-1]

    if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
        return {"messages": [], "thinking_steps": []}

    # Build tool lookup
    tools = {tool.name: tool for tool in get_all_tools()}

    tool_messages = []
    thinking_steps = []
    tools_used = list(state.get("tools_used", []))

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]

        # === DETAILED LOGGING: TOOL INPUT ===
        logger.info("Executing tool: %s with args: %s", tool_name, tool_args)
        logger.debug("=" * 80)
        logger.debug("TOOL INPUT: %s", tool_name)
        logger.debug("Args:\n%s", json.dumps(tool_args, default=str, ensure_ascii=False, indent=2))
        logger.debug("-" * 80)

        try:
            tool_fn = tools.get(tool_name)
            if not tool_fn:
                result = {"error": f"Tool '{tool_name}' not found"}
            else:
                result = await tool_fn.ainvoke(tool_args)

            # === DETAILED LOGGING: TOOL OUTPUT ===
            logger.debug("=" * 80)
            logger.debug("TOOL OUTPUT: %s", tool_name)
            result_str = json.dumps(result, default=str, ensure_ascii=False, indent=2)
            logger.debug("Full result:\n%s", result_str)

            # Log entity-level details at INFO for key tools
            _log_entity_details(tool_name, result)

            logger.debug("-" * 80)

            # Create ToolMessage (compact, no indent)
            result_compact = json.dumps(result, default=str, ensure_ascii=False)
            tool_messages.append(
                ToolMessage(content=result_compact, tool_call_id=tool_id, name=tool_name)
            )

            # Track
            tools_used.append(tool_name)
            thinking_steps.append({
                "step": f"✅ {tool_name} completed",
                "tool_used": tool_name,
                "result_summary": _summarize_result(result),
            })

        except Exception as e:
            logger.error("Tool %s failed: %s", tool_name, e, exc_info=True)
            error_result = json.dumps({"error": str(e)})
            tool_messages.append(
                ToolMessage(content=error_result, tool_call_id=tool_id, name=tool_name)
            )
            thinking_steps.append({
                "step": f"❌ {tool_name} failed: {str(e)[:100]}",
                "tool_used": tool_name,
                "result_summary": f"Error: {str(e)[:100]}",
            })

    # Update state with tool results 
    update = {
        "messages": tool_messages,
        "thinking_steps": thinking_steps,
        "tools_used": tools_used,
    }

    # Store specific results for context
    for msg in tool_messages:
        try:
            result_data = json.loads(msg.content)
            if msg.name == "get_user_profile" and "error" not in result_data:
                update["user_profile"] = result_data
            elif msg.name == "search_activities" and isinstance(result_data, list):
                update["activities"] = result_data
            elif msg.name == "get_weather" and "error" not in result_data:
                update["weather"] = result_data
            elif msg.name == "search_stays" and isinstance(result_data, list):
                update["stays"] = result_data
            elif msg.name == "search_restaurants" and isinstance(result_data, list):
                update["restaurants"] = result_data
            elif msg.name == "create_plan_structure" and result_data.get("valid"):
                update["current_plan"] = result_data.get("plan")
                update["is_plan_ready"] = True
            elif msg.name == "ask_user":
                update["needs_more_info"] = True
                update["questions"] = [result_data]
            # RAG tools — store results in rag_context
            elif msg.name == "rag_search" and isinstance(result_data, list):
                update["rag_context"] = result_data
            elif msg.name == "rag_search_for_plan" and isinstance(result_data, dict):
                # Flatten all results from the plan search into rag_context
                all_results = []
                for key in ("activities_for_time_slots", "restaurants_for_meals", "stays_for_overnight_only", "attractions_for_time_slots"):
                    all_results.extend(result_data.get(key, []))
                update["rag_context"] = all_results
            elif msg.name == "rag_get_similar" and isinstance(result_data, list):
                update["rag_context"] = result_data
        except (json.JSONDecodeError, TypeError):
            pass

    return update


def _summarize_result(result) -> str:
    """Create a brief summary of a tool result for the thinking step."""
    if isinstance(result, dict):
        if "error" in result:
            return f"Error: {result['error'][:80]}"
        if "available" in result:
            return f"{'Available' if result['available'] else 'Not available'} ({result.get('spots_left', '?')} spots)"
        keys = list(result.keys())[:3]
        return f"Got: {', '.join(keys)}..."
    if isinstance(result, list):
        return f"Found {len(result)} items"
    return str(result)[:100]


def _log_entity_details(tool_name: str, result) -> None:
    """Log individual entity details for key tools at INFO level."""
    if tool_name in ("search_activities", "rag_search") and isinstance(result, list):
        for item in result:
            if isinstance(item, dict):
                logger.info(
                    "   📌 %s: %s (ID: %s, price: %s, region: %s, score: %s)",
                    item.get("entity_type", "item"),
                    item.get("title", "?"),
                    item.get("entity_id", item.get("id", "?")),
                    item.get("price", "?"),
                    item.get("region", "?"),
                    item.get("score", "-"),
                )

    elif tool_name == "rag_search_for_plan" and isinstance(result, dict):
        for section_key in ("activities_for_time_slots", "restaurants_for_meals", "stays_for_overnight_only", "attractions_for_time_slots"):
            items = result.get(section_key, [])
            if items:
                logger.info("   📂 %s (%d items):", section_key, len(items))
                for item in items:
                    if isinstance(item, dict):
                        logger.info(
                            "      • %s (ID: %s, price: %s, score: %s)",
                            item.get("title", "?"),
                            item.get("entity_id", "?"),
                            item.get("price", "?"),
                            item.get("score", "-"),
                        )

    elif tool_name in ("search_stays",) and isinstance(result, list):
        for item in result:
            if isinstance(item, dict):
                logger.info(
                    "   🏨 Stay: %s (ID: %s, price: %s/night, rating: %s)",
                    item.get("title", item.get("name", "?")),
                    item.get("id", "?"),
                    item.get("price", "?"),
                    item.get("rating", "-"),
                )

    elif tool_name in ("search_restaurants",) and isinstance(result, list):
        for item in result:
            if isinstance(item, dict):
                logger.info(
                    "   🍽️ Restaurant: %s (ID: %s, price: %s)",
                    item.get("title", item.get("name", "?")),
                    item.get("id", "?"),
                    item.get("price", "?"),
                )

    elif tool_name == "get_weather" and isinstance(result, dict):
        logger.info("   🌤️ Weather: %s", result.get("description", result))

    elif tool_name == "get_user_profile" and isinstance(result, dict):
        logger.info("   👤 User: %s, preferences: %s", result.get("name", "?"), result.get("preferences", "?"))

