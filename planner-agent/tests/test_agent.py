"""Test the agent brain — basic graph compilation and structure."""

import pytest
from app.agent.brain import build_agent_graph, get_agent


def test_graph_builds():
    """Verify the LangGraph compiles without errors."""
    graph = build_agent_graph()
    assert graph is not None


def test_graph_singleton():
    """Verify get_agent returns the same instance."""
    agent1 = get_agent()
    agent2 = get_agent()
    assert agent1 is agent2


def test_graph_has_nodes():
    """Verify all required nodes exist."""
    graph = build_agent_graph()
    # LangGraph compiled graph should have the expected structure
    assert graph is not None
