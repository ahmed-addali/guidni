"""Brain — THE CORE 🧠 — LangGraph agent definition.

Defines the graph that controls the agent's reasoning flow:

    START → THINK → (has tool call?) → EXECUTE_TOOL → THINK (loop)
                  → (needs user info?) → RESPOND (question)
                  → (ready to respond?) → VALIDATE → RESPOND
                  → (max iterations?) → RESPOND (forced)
    VALIDATE → (errors?) → THINK (retry)
             → (ok?) → RESPOND → END

Max iterations: 15 (safety — prevents infinite loops)
"""

import logging
from langgraph.graph import StateGraph, END
from app.agent.state import AgentState
from app.agent.nodes.thinker import thinker_node
from app.agent.nodes.tool_executor import tool_executor_node
from app.agent.nodes.validator import validator_node
from app.agent.nodes.responder import responder_node
from app.config import settings

logger = logging.getLogger(__name__)


def _should_continue(state: AgentState) -> str:
    """Determine the next node after THINK.

    Routing logic:
    - If max iterations reached → go to RESPOND (forced)
    - If LLM wants to call a tool → go to EXECUTE_TOOL
    - If agent needs user input → go to RESPOND
    - If a plan was just built (is_plan_ready) → go to VALIDATE
    - Otherwise (text response) → go to RESPOND directly
    """
    # Safety: max iterations
    if state.get("iteration_count", 0) >= settings.MAX_AGENT_ITERATIONS:
        logger.warning("Max iterations reached (%d), forcing response", state["iteration_count"])
        return "respond"

    # Check last message for tool calls
    messages = state.get("messages", [])
    if messages:
        last_message = messages[-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "execute_tool"

    # If agent flagged needs_more_info
    if state.get("needs_more_info"):
        return "respond"

    # Only validate if a structured plan was explicitly created
    if state.get("is_plan_ready") and state.get("current_plan"):
        return "validate"

    # Default: text response → go straight to respond
    return "respond"


def _after_validation(state: AgentState) -> str:
    """Determine the next node after VALIDATE.

    - If validation failed and we have retries left → back to THINK
    - Otherwise → RESPOND
    """
    # If plan was invalidated and we have iterations left
    if (
        not state.get("is_plan_ready", True)
        and state.get("iteration_count", 0) < settings.MAX_AGENT_ITERATIONS
    ):
        return "think"

    return "respond"


def _after_tool_execution(state: AgentState) -> str:
    """After tool execution, always go back to THINK for re-evaluation."""
    # If ask_user tool was used, go straight to respond
    if state.get("needs_more_info"):
        return "respond"

    return "think"


def build_agent_graph() -> StateGraph:
    """Build and compile the LangGraph agent.

    Graph structure:
        ┌─────────────┐
        │   START     │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │   THINK     │◄────────────────┐
        └──────┬──────┘                 │
               │                        │
        ┌──────▼──────┐          ┌──────┴──────┐
        │   ROUTE     │──tool──▶│ EXECUTE_TOOL │
        └──┬───┬──────┘          └─────────────┘
           │   │
     respond  validate
           │   │
           │   ┌──────▼──────┐
           │   │   VALIDATE  │
           │   └──────┬──────┘
           │          │
           │    ┌─────▼─────┐
           └───▶│  RESPOND  │
                └─────┬─────┘
                      │
                ┌─────▼─────┐
                │    END    │
                └───────────┘
    """
    # Create graph
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("think", thinker_node)
    graph.add_node("execute_tool", tool_executor_node)
    graph.add_node("validate", validator_node)
    graph.add_node("respond", responder_node)

    # Set entry point
    graph.set_entry_point("think")

    # Add edges
    # THINK → conditional routing
    graph.add_conditional_edges(
        "think",
        _should_continue,
        {
            "execute_tool": "execute_tool",
            "validate": "validate",
            "respond": "respond",
        },
    )

    # EXECUTE_TOOL → back to THINK (or RESPOND if ask_user)
    graph.add_conditional_edges(
        "execute_tool",
        _after_tool_execution,
        {
            "think": "think",
            "respond": "respond",
        },
    )

    # VALIDATE → conditional (retry or respond)
    graph.add_conditional_edges(
        "validate",
        _after_validation,
        {
            "think": "think",
            "respond": "respond",
        },
    )

    # RESPOND → END
    graph.add_edge("respond", END)

    # Compile
    compiled = graph.compile()
    return compiled


# Singleton compiled graph
_agent_graph = None


def get_agent() -> StateGraph:
    """Get the compiled agent graph (singleton)."""
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = build_agent_graph()
    return _agent_graph


async def run_agent(
    user_id: str,
    conversation_id: str,
    messages: list,
    current_plan: dict | None = None,
    context_summary: dict | None = None,
    llm_provider: str | None = None,
    llm_model: str | None = None,
) -> dict:
    """Run the agent with the given input.

    Args:
        user_id: User's ID
        conversation_id: Conversation ID
        messages: LangChain message list (conversation history)
        current_plan: Existing plan (if modification)
        context_summary: Conversation context summary
        llm_provider: LLM provider override (e.g. "gemini", "groq")
        llm_model: LLM model override (e.g. "gemini-2.5-flash")

    Returns:
        Final agent state with response
    """
    agent = get_agent()

    # Initial state
    initial_state: AgentState = {
        "messages": messages,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "user_profile": None,
        "activities": None,
        "enriched_activities": None,
        "weather": None,
        "stays": None,
        "restaurants": None,
        "rag_context": None,
        "current_plan": current_plan,
        "thinking_steps": [],
        "tools_used": [],
        "iteration_count": 0,
        "needs_more_info": False,
        "is_plan_ready": False,
        "is_modification": current_plan is not None,
        "response_type": "text",
        "final_response": "",
        "final_plan": None,
        "questions": None,
        "llm_provider": llm_provider,
        "llm_model": llm_model,
    }

    # Run the graph with streaming to log each step
    model_label = f"{llm_provider}/{llm_model}" if llm_provider else "default"
    logger.info("Starting agent run for user=%s conv=%s model=%s", user_id, conversation_id, model_label)
    config = {"recursion_limit": 100}
    step_count = 0

    # Stream to get step-by-step logging AND accumulate the final state
    # We merge all deltas into final_state ourselves (no duplicate ainvoke)
    final_state = dict(initial_state)

    async for event in agent.astream(initial_state, config=config):
        step_count += 1
        for node_name, node_output in event.items():
            if node_name == "__end__":
                continue

            # Log the node execution
            logger.info("═" * 50)
            logger.info("▶ Step %d: [%s]", step_count, node_name.upper())

            # Merge this node's output into final_state
            if isinstance(node_output, dict):
                for key, value in node_output.items():
                    if key == "messages" and isinstance(value, list):
                        # Messages accumulate via operator.add
                        final_state.setdefault("messages", []).extend(value)
                    elif key == "thinking_steps" and isinstance(value, list):
                        final_state.setdefault("thinking_steps", []).extend(value)
                    else:
                        final_state[key] = value

                # Log FULL message content (not truncated)
                for msg in node_output.get("messages", []):
                    role = msg.__class__.__name__
                    if hasattr(msg, "content") and msg.content:
                        # Normalize: Gemini returns list of dicts, Ollama/Groq returns str
                        text = msg.content
                        if isinstance(text, list):
                            text = "\n".join(
                                item.get("text", "") if isinstance(item, dict) else str(item)
                                for item in text
                            )
                        logger.info("   💭 [%s] %s", role, text)
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            import json as _json
                            logger.info("   🔧 Tool call: %s(%s)", tc["name"],
                                        _json.dumps(tc["args"], default=str, ensure_ascii=False))
                    # Log full tool result content
                    if hasattr(msg, "name") and hasattr(msg, "content") and role == "ToolMessage":
                        logger.info("   📋 Tool result [%s]: %s", msg.name, msg.content)

                # Log thinking steps (summary for UI)
                for ts in node_output.get("thinking_steps", []):
                    if ts.get("tool_used"):
                        logger.info("   🔧 Tool: %s", ts["tool_used"])
                    if ts.get("result_summary"):
                        logger.info("   📋 Summary: %s", ts["result_summary"])

                if "iteration_count" in node_output:
                    logger.info("   🔄 Iteration: %d", node_output["iteration_count"])
                if "response_type" in node_output:
                    logger.info("   📤 Response type: %s", node_output["response_type"])

    logger.info("═" * 50)
    logger.info(
        "✅ Agent completed: type=%s, iterations=%d, tools=%s",
        final_state.get("response_type"),
        final_state.get("iteration_count", 0),
        final_state.get("tools_used", []),
    )

    return final_state
