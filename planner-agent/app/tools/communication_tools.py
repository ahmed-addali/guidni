"""Communication tools — ask the user a question.

Special tool that signals to the graph that the agent needs user input.
Does not perform any actual work — it triggers the ASK_USER response type.
"""

from langchain_core.tools import tool


@tool
async def ask_user(question: str, suggestions: str = "") -> dict:
    """Ask the user a question when you need more information to proceed.
    Include helpful suggestions for quick answers. Use ONLY when truly necessary —
    try to figure things out yourself first using available data.

    Args:
        question: The question to ask the user
        suggestions: Comma-separated suggested quick answers (e.g. "5 days, 7 days, 10 days")
    """
    suggestion_list = [s.strip() for s in suggestions.split(",") if s.strip()] if suggestions else []

    return {
        "action": "ask_user",
        "question": question,
        "suggestions": suggestion_list,
    }
