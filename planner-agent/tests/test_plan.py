"""Test plan schemas — verify Pydantic model validation."""

import pytest
from app.schemas.plan import PlanSlot, DayPlan, FullPlan, StaySuggestion, BudgetBreakdown
from app.schemas.responses import PlannerResponse, ThinkingStep, QuestionOption
from app.schemas.requests import ChatRequest


def test_plan_slot():
    """Test PlanSlot creation."""
    slot = PlanSlot(
        time="09:00",
        end_time="11:00",
        type="activity",
        title="Beach Visit",
        description="Morning at the beach",
        category="outdoor",
        price=0,
        duration=120,
        reason="Perfect weather for the beach",
        bookable=False,
    )
    assert slot.time == "09:00"
    assert slot.type == "activity"


def test_day_plan():
    """Test DayPlan creation."""
    day = DayPlan(
        day_number=1,
        date="2024-03-15",
        theme="Arrival & Relaxation",
        slots=[
            PlanSlot(
                time="09:00", end_time="11:00",
                type="activity", title="Beach",
                description="Relax",
            ),
        ],
    )
    assert day.day_number == 1
    assert len(day.slots) == 1


def test_full_plan():
    """Test FullPlan creation."""
    plan = FullPlan(
        days=[
            DayPlan(day_number=1, theme="Arrival"),
            DayPlan(day_number=2, theme="Adventure"),
        ],
        summary="A romantic 2-day trip",
        total_budget=500,
        tips=["Bring sunscreen"],
        budget_breakdown=BudgetBreakdown(
            activities=200, accommodation=200, food=80, transport=20, total=500
        ),
    )
    assert len(plan.days) == 2
    assert plan.total_budget == 500


def test_chat_request():
    """Test ChatRequest validation."""
    req = ChatRequest(
        user_id="user123",
        message="Plan me a 5-day trip",
    )
    assert req.user_id == "user123"
    assert req.conversation_id is None


def test_planner_response():
    """Test PlannerResponse creation."""
    resp = PlannerResponse(
        conversation_id="conv123",
        response_type="text",
        content="Hello! I'd love to help you plan your trip.",
        thinking_steps=[
            ThinkingStep(step="Analyzing request..."),
        ],
    )
    assert resp.response_type == "text"
    assert len(resp.thinking_steps) == 1


def test_question_option():
    """Test QuestionOption."""
    q = QuestionOption(
        question="How many days?",
        suggestions=["3 days", "5 days", "7 days"],
    )
    assert len(q.suggestions) == 3
