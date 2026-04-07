"""Agent State — the state that flows through the LangGraph graph.

This TypedDict defines everything the agent tracks during reasoning:
- Conversation messages
- User context
- Gathered data (activities, weather, stays)
- Current plan
- Thinking steps (for collapsible UI)
- Decision flags
"""

from typing import TypedDict, Annotated, Optional
from langchain_core.messages import BaseMessage
import operator


class AgentState(TypedDict):
    """The state maintained throughout the agent's reasoning process.

    LangGraph uses this to pass data between nodes.
    """
    # ===== Core =====
    messages: Annotated[list[BaseMessage], operator.add]  # Accumulate messages
    user_id: str
    conversation_id: str

    # ===== What the agent has learned =====
    user_profile: Optional[dict]           # User history analysis
    activities: Optional[list[dict]]       # Available activities
    enriched_activities: Optional[list[dict]]  # With AI metadata
    weather: Optional[dict]                # Weather data
    stays: Optional[list[dict]]            # Accommodation options
    restaurants: Optional[list[dict]]      # Dining options
    rag_context: Optional[list[dict]]      # Latest RAG search results

    # ===== Current state =====
    current_plan: Optional[dict]           # Plan in progress
    thinking_steps: Annotated[list[dict], operator.add]  # Collapsible UI steps
    tools_used: list[str]                  # Tools used this turn
    iteration_count: int                   # Safety counter

    # ===== Decisions =====
    needs_more_info: bool                  # Must ask user a question?
    is_plan_ready: bool                    # Plan finalized?
    is_modification: bool                  # Modifying existing plan?

    # ===== Output =====
    response_type: str                     # "plan" | "question" | "modification" | "text"
    final_response: str                    # The text response
    final_plan: Optional[dict]             # The structured plan
    questions: Optional[list[dict]]        # Questions to ask user

    # ===== LLM Selection (per-request) =====
    llm_provider: Optional[str]            # "ollama", "groq", "gemini", "openrouter"
    llm_model: Optional[str]               # Model name (e.g. "qwen2.5:7b")

