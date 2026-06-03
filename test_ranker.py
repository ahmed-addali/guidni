import pytest
import numpy as np
from app.reco.linucb import ArmState, ScoredArm
from app.reco.ranker import (
    apply_budget_filter,
    apply_diversity_filter,
    apply_new_listing_guarantee,
    apply_tag_exploration,
    apply_margin_sort,
    apply_seasonal_filter,
)

def test_budget_filter():
    arms = [
        ArmState("id1", "STAY", "zone", price=100.0),
        ArmState("id2", "STAY", "zone", price=125.0),
        ArmState("id3", "STAY", "zone", price=126.0),
    ]
    # Budget = 100, threshold = 125
    filtered = apply_budget_filter(arms, budget=100.0)
    assert len(filtered) == 2
    assert "id1" in [a.listing_id for a in filtered]
    assert "id2" in [a.listing_id for a in filtered]
    assert "id3" not in [a.listing_id for a in filtered]

def test_diversity_filter():
    scored = [
        ScoredArm("1", "ACTIVITY"),
        ScoredArm("2", "ACTIVITY"),
        ScoredArm("3", "ACTIVITY"),
        ScoredArm("4", "STAY"),
    ]
    filtered = apply_diversity_filter(scored, max_per_type=2)
    assert len(filtered) == 3
    type_counts = {"ACTIVITY": 0, "STAY": 0}
    for arm in filtered:
        type_counts[arm.listing_type] += 1
    assert type_counts["ACTIVITY"] == 2
    assert type_counts["STAY"] == 1

def test_new_listing_guarantee():
    scored = [
        ScoredArm("1", "ACTIVITY", impressions=100),
        ScoredArm("2", "ACTIVITY", impressions=100),
    ]
    all_scored = scored + [
        ScoredArm("3", "STAY", impressions=10),
    ]
    final = apply_new_listing_guarantee(scored, all_scored)
    assert final[-1].listing_id == "3"

def test_tag_exploration():
    final = [ScoredArm(str(i), "ACTIVITY", tags=["pool"]) for i in range(10)]
    all_scored = final + [ScoredArm("11", "ACTIVITY", tags=["luxury"])]
    user_tag_affinity = {"pool": 0.8, "luxury": 0.1}
    
    explored = apply_tag_exploration(final, all_scored, user_tag_affinity, exploration_rate=0.1)
    # Exactly 10% of 10 is 1. The last item should be replaced.
    assert explored[-1].listing_id == "11"
    assert explored[-1].tags == ["luxury"]
    assert len(explored) == 10

def test_margin_sort():
    final = [
        ScoredArm("1", "ACTIVITY", score=0.90, commission_rate=0.10),
        ScoredArm("2", "ACTIVITY", score=0.88, commission_rate=0.20),
        ScoredArm("3", "STAY", score=0.80, commission_rate=0.15),
        ScoredArm("4", "STAY", score=0.78, commission_rate=0.05),
    ]
    sorted_arms = apply_margin_sort(final)
    # Tier 1: 0.90 and 0.88 (diff 0.02 < 0.05). Should sort by commission: 0.20 first.
    assert sorted_arms[0].listing_id == "2"
    assert sorted_arms[1].listing_id == "1"
    
    # Tier 2: 0.80 and 0.78. 0.80 is 0.15, 0.78 is 0.05. Already sorted.
    assert sorted_arms[2].listing_id == "3"
    assert sorted_arms[3].listing_id == "4"

def test_seasonal_filter():
    arms = [
        ArmState("1", "ACTIVITY", "zone", tags=["beach", "pool"]),
        ArmState("2", "ACTIVITY", "zone", tags=["ski", "mountain"]),
    ]
    # Winter (Dec)
    winter = apply_seasonal_filter(arms, month=12)
    assert len(winter) == 1
    assert winter[0].listing_id == "2"
    
    # Summer (Jul)
    summer = apply_seasonal_filter(arms, month=7)
    assert len(summer) == 1
    assert summer[0].listing_id == "1"
