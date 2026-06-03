import pytest
import numpy as np
from app.reco.linucb import (
    compute_reward,
    is_matrix_healthy,
    partial_reset,
)
from app.reco.context import D_PHI

def test_delta_rewards_anti_inflation():
    """Verify max reward is recorded, not sum."""
    session_rewards = {}
    
    # Send click
    r1 = compute_reward("click", session_rewards=session_rewards, listing_id="item_1")
    assert r1 == 0.3
    assert session_rewards["item_1"] == 0.3
    
    # Send scroll_reviews
    r2 = compute_reward("scroll_reviews", session_rewards=session_rewards, listing_id="item_1")
    assert r2 == 0.3  # (0.6 - 0.3 = 0.3)
    assert session_rewards["item_1"] == 0.6
    
    # Send wishlist
    r3 = compute_reward("wishlist", session_rewards=session_rewards, listing_id="item_1")
    assert abs(r3 - 0.25) < 0.001  # (0.85 - 0.60 = 0.25)
    assert session_rewards["item_1"] == 0.85
    
    # Total sum of rewards applied is r1 + r2 + r3 = 0.85, not 1.75
    assert abs((r1 + r2 + r3) - 0.85) < 0.001

def test_matrix_health_fallback():
    """Verify matrix health detection and reset."""
    # Healthy matrix
    A_healthy = np.eye(D_PHI)
    assert is_matrix_healthy(A_healthy) == True
    
    # Unhealthy matrix (singular/zeros)
    A_unhealthy = np.zeros((D_PHI, D_PHI))
    assert is_matrix_healthy(A_unhealthy) == False
    
    # Unhealthy matrix (NaN)
    A_nan = np.eye(D_PHI)
    A_nan[0, 0] = np.nan
    assert is_matrix_healthy(A_nan) == False

def test_concept_drift_partial_reset():
    """Verify formula A_new = 0.7 * A + 0.3 * I and b_new = 0.7 * b"""
    A = np.ones((D_PHI, D_PHI)) * 2
    b = np.ones(D_PHI) * 2
    
    A_new, b_new = partial_reset(A, b, lambda_decay=0.7)
    
    # Check A_new[0,0] = 0.7 * 2 + 0.3 * 1 = 1.4 + 0.3 = 1.7
    assert abs(A_new[0, 0] - 1.7) < 0.001
    
    # Check A_new[0,1] = 0.7 * 2 + 0.3 * 0 = 1.4
    assert abs(A_new[0, 1] - 1.4) < 0.001
    
    # Check b_new[0] = 0.7 * 2 = 1.4
    assert abs(b_new[0] - 1.4) < 0.001
