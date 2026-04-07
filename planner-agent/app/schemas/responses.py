"""API response schemas (Pydantic models).

Includes ThinkingStep for the collapsible UI and PlannerResponse for the main response.
"""

from pydantic import BaseModel
from typing import Optional
from app.schemas.plan import FullPlan


class ThinkingStep(BaseModel):
    """One step of the agent's reasoning — shown in collapsible UI."""
    step: str  # "Analyzing your preferences..."
    tool_used: Optional[str] = None
    result_summary: Optional[str] = None


class QuestionOption(BaseModel):
    """A question the agent wants to ask, with suggestions."""
    question: str
    suggestions: list[str] = []


class PlannerResponse(BaseModel):
    """The main response from the planner agent."""
    conversation_id: str
    response_type: str  # "plan" | "question" | "modification" | "text"
    content: str  # The text response
    plan: Optional[FullPlan] = None
    thinking_steps: list[ThinkingStep] = []
    questions: Optional[list[QuestionOption]] = None
    ids: list[dict] = []
