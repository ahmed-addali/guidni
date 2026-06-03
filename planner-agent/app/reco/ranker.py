"""Ranker — post-processing pipeline after LinUCB scoring.

Applies a chain of filters and adjustments to the raw LinUCB scores:
    1. Popularity correction (underexposed flag)
    2. Time-of-day filter
    3. Budget filter
    4. LinUCB scoring
    5. Diversity filter (max per listing type)
    6. New listing guarantee
    7. Tag exploration (serendipity)
    8. Margin sort (commission tiebreaker)
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np

from app.reco.context import (
    TAG_VOCAB,
    UserContext,
    build_phi,
    build_user_vector,
)
from app.reco.linucb import ArmState, ScoredArm, score_arms

from app.reco.logger import reco_logger as logger


# ──────────────────────────────────────────────────────────────
# Filter: time of day
# ──────────────────────────────────────────────────────────────

def apply_time_filter(arms: list[ArmState], hour: int) -> list[ArmState]:
    """Remove listings inappropriate for the current time of day.

    Rules:
        - Morning (6–12): remove 'best_evening' and 'bar' tags
        - Evening (20–23): remove 'best_morning' tags
        - Other hours: no filter

    Args:
        arms: Input arm list.
        hour: Current hour (0–23).

    Returns:
        Filtered list of arms.
    """
    if 6 <= hour < 12:
        excluded = {"best_evening", "bar"}
        result = [a for a in arms if not (set(a.tags) & excluded)]
        removed = len(arms) - len(result)
        if removed > 0:
            logger.debug("Time filter (morning): removed %d arms", removed)
        return result

    if 20 <= hour <= 23:
        excluded = {"best_morning"}
        result = [a for a in arms if not (set(a.tags) & excluded)]
        removed = len(arms) - len(result)
        if removed > 0:
            logger.debug("Time filter (evening): removed %d arms", removed)
        return result

    return arms


# ──────────────────────────────────────────────────────────────
# Filter: seasonal
# ──────────────────────────────────────────────────────────────

def apply_seasonal_filter(arms: list[ArmState], month: int) -> list[ArmState]:
    """Remove listings inappropriate for the current season.

    Rules:
        - Winter (12, 1, 2): remove 'beach', 'best_summer'
        - Summer (6, 7, 8): remove 'ski', 'best_winter'

    Args:
        arms: Input arm list.
        month: Current month (1–12).

    Returns:
        Filtered list of arms.
    """
    if month in (12, 1, 2):
        excluded = {"beach", "best_summer"}
        result = [a for a in arms if not (set(a.tags) & excluded)]
        removed = len(arms) - len(result)
        if removed > 0:
            logger.debug("Seasonal filter (winter): removed %d arms", removed)
        return result

    if month in (6, 7, 8):
        excluded = {"ski", "best_winter"}
        result = [a for a in arms if not (set(a.tags) & excluded)]
        removed = len(arms) - len(result)
        if removed > 0:
            logger.debug("Seasonal filter (summer): removed %d arms", removed)
        return result

    return arms


# ──────────────────────────────────────────────────────────────
# Filter: budget
# ──────────────────────────────────────────────────────────────

def apply_budget_filter(
    arms: list[ArmState],
    budget: float | None,
) -> list[ArmState]:
    """Remove listings priced above budget × 1.25.

    Arms without a price (price=0) are kept.

    Args:
        arms: Input arm list.
        budget: User budget estimate, None if unknown.

    Returns:
        Filtered list of arms.
    """
    if budget is None or budget <= 0:
        return arms

    threshold = budget * 1.25
    result = [a for a in arms if a.price <= 0 or a.price <= threshold]
    removed = len(arms) - len(result)
    if removed > 0:
        logger.debug(
            "Budget filter: removed %d arms (budget=%.0f, threshold=%.0f)",
            removed, budget, threshold,
        )
    return result


# ──────────────────────────────────────────────────────────────
# Filter: diversity (max per listing type)
# ──────────────────────────────────────────────────────────────

def apply_diversity_filter(
    scored: list[ScoredArm],
    max_per_type: int = 2,
) -> list[ScoredArm]:
    """Limit results to max_per_type per listing_type.

    Walks top-to-bottom preserving original rank order.

    Args:
        scored: Scored arms in rank order.
        max_per_type: Maximum listings per type.

    Returns:
        Diversified list preserving rank order.
    """
    type_counts: dict[str, int] = {}
    result: list[ScoredArm] = []

    for arm in scored:
        count = type_counts.get(arm.listing_type, 0)
        if count < max_per_type:
            result.append(arm)
            type_counts[arm.listing_type] = count + 1

    skipped = len(scored) - len(result)
    if skipped > 0:
        logger.debug("Diversity filter: skipped %d arms", skipped)
    return result


# ──────────────────────────────────────────────────────────────
# Filter: new listing guarantee
# ──────────────────────────────────────────────────────────────

def apply_new_listing_guarantee(
    final: list[ScoredArm],
    all_scored: list[ScoredArm],
) -> list[ScoredArm]:
    """Ensure at least one underexposed listing appears in results.

    If no underexposed listing is in `final`, the highest-scored
    underexposed listing from `all_scored` replaces the last slot.

    Args:
        final: Current result list.
        all_scored: Full scored list (before truncation).

    Returns:
        Modified list with new listing guarantee.
    """
    if not final:
        return final

    # Check if any underexposed listing is already present
    has_underexposed = any(s.impressions < 50 for s in final)
    if has_underexposed:
        return final

    # Find best underexposed not already in final
    final_ids = {s.listing_id for s in final}
    for candidate in all_scored:
        if candidate.impressions < 50 and candidate.listing_id not in final_ids:
            result = list(final)
            result[-1] = candidate
            logger.debug(
                "New listing guarantee: inserted %s (impressions=%d) at last slot",
                candidate.listing_id, candidate.impressions,
            )
            return result

    return final


# ──────────────────────────────────────────────────────────────
# Filter: tag exploration
# ──────────────────────────────────────────────────────────────

def apply_tag_exploration(
    final: list[ScoredArm],
    all_scored: list[ScoredArm],
    user_tag_affinity: dict[str, float],
    exploration_rate: float = 0.1,
) -> list[ScoredArm]:
    """Inject serendipity by promoting listings with unexplored tags.

    Finds tags the user hasn't engaged with (affinity < 0.2 or missing),
    then replaces the last n_explore slots with the highest-scored
    listings containing those tags.

    Args:
        final: Current result list.
        all_scored: Full scored list.
        user_tag_affinity: User's tag affinity dict.
        exploration_rate: Fraction of results to replace (default 0.1).

    Returns:
        Modified list with tag exploration injections.
    """
    if not final or not all_scored:
        return final

    n_explore = round(len(final) * exploration_rate)
    if n_explore < 1:
        return final

    # Find unexplored tags
    unexplored_tags = {
        t for t in TAG_VOCAB
        if user_tag_affinity.get(t, 0.0) < 0.2
    }

    if not unexplored_tags:
        return final

    # Find highest-scored arms with unexplored tags not already in final
    final_ids = {s.listing_id for s in final}
    candidates: list[ScoredArm] = []
    for arm in all_scored:
        if arm.listing_id in final_ids:
            continue
        arm_tags = set(arm.tags)
        if arm_tags & unexplored_tags:
            candidates.append(arm)
            if len(candidates) >= n_explore:
                break

    if not candidates:
        return final

    # Replace last n_explore slots
    result = list(final)
    for i, candidate in enumerate(candidates):
        replace_idx = len(result) - 1 - i
        if replace_idx < 0:
            break
        result[replace_idx] = candidate
        logger.debug(
            "Tag exploration: slot %d → %s (tags=%s)",
            replace_idx, candidate.listing_id, candidate.tags[:3],
        )

    return result


# ──────────────────────────────────────────────────────────────
# Filter: margin sort (commission tiebreaker)
# ──────────────────────────────────────────────────────────────

def apply_margin_sort(final: list[ScoredArm]) -> list[ScoredArm]:
    """Within score tiers (gap < 0.05), sort by commission_rate descending.

    Tiers are formed by grouping consecutive items with score gap < 0.05.
    Within each tier, items are sorted by commission_rate (highest first).
    Tiers keep their relative order.

    Args:
        final: Scored arms in rank order.

    Returns:
        Re-sorted list with commission tiebreaking.
    """
    if len(final) <= 1:
        return final

    # Build tiers
    tiers: list[list[ScoredArm]] = []
    current_tier: list[ScoredArm] = [final[0]]

    for i in range(1, len(final)):
        if abs(final[i].score - current_tier[0].score) < 0.05:
            current_tier.append(final[i])
        else:
            tiers.append(current_tier)
            current_tier = [final[i]]
    tiers.append(current_tier)

    # Sort within tiers by commission_rate descending
    result: list[ScoredArm] = []
    for tier in tiers:
        if len(tier) > 1:
            tier.sort(key=lambda s: s.commission_rate, reverse=True)
        result.extend(tier)

    return result


# ──────────────────────────────────────────────────────────────
# Popularity correction
# ──────────────────────────────────────────────────────────────

def apply_popularity_correction(arms: list[ArmState]) -> list[ArmState]:
    """Mark arms as underexposed if impressions < 50.

    This flag is read by score_arms() to add UNDEREXPOSED_BONUS.

    Args:
        arms: Mutable arm list (modified in place).

    Returns:
        Same list with is_underexposed updated.
    """
    for arm in arms:
        arm.is_underexposed = arm.impressions < 50
    return arms


# ──────────────────────────────────────────────────────────────
# Main ranking pipeline
# ──────────────────────────────────────────────────────────────

def rank(
    arms: list[ArmState],
    A: np.ndarray,
    b: np.ndarray,
    ctx: UserContext,
    user_tag_affinity: dict[str, float] = {},
    session_rewards: dict[str, float] | None = None,
    rank_shown: dict[str, int] | None = None,
    top_k: int = 10,
) -> list[ScoredArm]:
    """Full ranking pipeline: filter → score → post-process.

    Pipeline (exact order):
        1. apply_popularity_correction
        2. apply_time_filter
        3. apply_seasonal_filter
        4. apply_budget_filter
        5. Build phi_per_arm
        6. score_arms (LinUCB)
        7. apply_diversity_filter (max 2 per type)
        8. apply_new_listing_guarantee
        9. apply_tag_exploration
        10. apply_margin_sort
        11. Return top_k

    Args:
        arms: All available arms to rank.
        A: Global A matrix (D_PHI × D_PHI).
        b: Global b vector (D_PHI,).
        ctx: Current user context.
        user_tag_affinity: User's tag affinity for exploration.
        session_rewards: Session reward tracker for dedup.
        rank_shown: Previous rank positions for IPS correction.
        top_k: Number of results to return.

    Returns:
        Top-k scored and post-processed arms.
    """
    if not arms:
        return []

    logger.debug("Ranking Pipeline Start: %d total arms", len(arms))

    # 1. Popularity correction
    arms = apply_popularity_correction(arms)
    logger.debug("Step 1 (Popularity): %d arms marked underexposed", sum(1 for a in arms if a.is_underexposed))

    # 2. Time filter
    arms = apply_time_filter(arms, ctx.hour)
    logger.debug("Step 2 (Time Filter): %d arms remain", len(arms))

    # 3. Seasonal filter
    arms = apply_seasonal_filter(arms, ctx.month)
    logger.debug("Step 3 (Seasonal Filter): %d arms remain", len(arms))

    # 4. Budget filter
    arms = apply_budget_filter(arms, ctx.budget_estimate)
    logger.debug("Step 4 (Budget Filter): %d arms remain", len(arms))

    if not arms:
        logger.warning("All arms filtered out — returning empty")
        return []

    # 5. Build phi per arm
    x_user = build_user_vector(ctx)
    phi_per_arm: dict[str, np.ndarray] = {}
    for arm in arms:
        phi_per_arm[arm.listing_id] = build_phi(x_user, arm.tags)
    logger.debug("Step 5 (Feature Engineering): Generated phi for %d arms", len(phi_per_arm))

    # 6. LinUCB scoring
    scored = score_arms(
        arms, phi_per_arm, A, b,
        rank_shown=rank_shown,
    )
    logger.debug("Step 6 (LinUCB Scoring): %d arms scored", len(scored))

    if not scored:
        logger.warning("No arms scored — returning empty")
        return []

    # 7. Diversity filter
    diverse = apply_diversity_filter(scored, max_per_type=2)
    logger.debug("Step 7 (Diversity Filter): %d arms remain", len(diverse))

    # 8. New listing guarantee
    result = apply_new_listing_guarantee(diverse[:top_k], scored)
    logger.debug("Step 8 (New Listing Guarantee): processed")

    # 9. Tag exploration
    result = apply_tag_exploration(result, scored, user_tag_affinity)
    logger.debug("Step 9 (Tag Exploration): processed")

    # 10. Margin sort
    result = apply_margin_sort(result)
    logger.debug("Step 10 (Margin Sort): final array length %d", len(result))

    logger.debug(
        "Rank pipeline summary: %d input arms → %d scored → %d diverse → %d final",
        len(arms), len(scored), len(diverse), len(result[:top_k]),
    )

    return result[:top_k]


# ──────────────────────────────────────────────────────────────
# Self-tests
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)
    passed = 0
    failed = 0

    def _test(name: str, cond: bool) -> None:
        global passed, failed
        if cond:
            print(f"  ✅ {name}")
            passed += 1
        else:
            print(f"  ❌ {name}")
            failed += 1

    print("\n" + "=" * 50)
    print(" ranker.py — Unit Tests")
    print("=" * 50)

    from app.reco.context import D_PHI

    # Build test arms
    test_arms = [
        ArmState("a1", "ACTIVITY", "Djerba", ["pool", "beach_access", "best_morning"],
                 impressions=100, price=50, commission_rate=0.15, is_underexposed=False),
        ArmState("a2", "ACTIVITY", "Djerba", ["adventure", "nature"],
                 impressions=80, price=30, commission_rate=0.10, is_underexposed=False),
        ArmState("s1", "STAY", "Djerba", ["luxury", "spa", "pool"],
                 impressions=200, price=300, commission_rate=0.12, is_underexposed=False),
        ArmState("s2", "STAY", "Djerba", ["hostel", "budget", "wifi"],
                 impressions=20, price=40, commission_rate=0.08, is_underexposed=True),
        ArmState("r1", "RESTAURANT", "Djerba", ["fine_dining", "sea_view", "best_evening"],
                 impressions=60, price=80, commission_rate=0.10, is_underexposed=False),
        ArmState("r2", "RESTAURANT", "Djerba", ["street_food", "casual_dining", "budget"],
                 impressions=5, price=15, commission_rate=0.05, is_underexposed=True),
    ]

    # --- Test 1: Time filter ---
    print("\n⏰ Time filter")
    morning = apply_time_filter(test_arms, 8)
    _test("morning removes best_evening", all("best_evening" not in a.tags for a in morning))
    _test("morning removes bar", all("bar" not in a.tags for a in morning))

    evening = apply_time_filter(test_arms, 21)
    _test("evening removes best_morning", all("best_morning" not in a.tags for a in evening))

    midday = apply_time_filter(test_arms, 14)
    _test("midday keeps all", len(midday) == len(test_arms))

    # --- Test 1.5: Seasonal filter ---
    print("\n🌤 Seasonal filter")
    seasonal_arms = [
        ArmState("w1", "ACTIVITY", "Djerba", ["beach", "best_summer"]),
        ArmState("w2", "ACTIVITY", "Djerba", ["ski", "best_winter"]),
        ArmState("w3", "ACTIVITY", "Djerba", ["indoor", "museum"]),
    ]
    winter = apply_seasonal_filter(seasonal_arms, 12)
    _test("winter removes beach/best_summer", all("beach" not in a.tags and "best_summer" not in a.tags for a in winter))
    _test("winter keeps ski", any("ski" in a.tags for a in winter))
    
    summer = apply_seasonal_filter(seasonal_arms, 7)
    _test("summer removes ski/best_winter", all("ski" not in a.tags and "best_winter" not in a.tags for a in summer))
    _test("summer keeps beach", any("beach" in a.tags for a in summer))

    # --- Test 2: Budget filter ---
    print("\n💰 Budget filter")
    budget_50 = apply_budget_filter(test_arms, 50)
    _test("budget=50 removes expensive", all(
        a.price <= 62.5 or a.price <= 0 for a in budget_50
    ))

    no_budget = apply_budget_filter(test_arms, None)
    _test("None budget keeps all", len(no_budget) == len(test_arms))

    # --- Test 3: Diversity filter ---
    print("\n🎭 Diversity filter")
    # Create scored versions
    scored_test = [
        ScoredArm(a.listing_id, a.listing_type, a.tags, score=1.0 - i * 0.1,
                  impressions=a.impressions, commission_rate=a.commission_rate)
        for i, a in enumerate(test_arms)
    ]
    diverse = apply_diversity_filter(scored_test, max_per_type=2)
    type_counts = {}
    for s in diverse:
        type_counts[s.listing_type] = type_counts.get(s.listing_type, 0) + 1
    _test("max 2 per type", all(c <= 2 for c in type_counts.values()))

    # --- Test 4: New listing guarantee ---
    print("\n🆕 New listing guarantee")
    # All arms with high impressions
    established = [
        ScoredArm("e1", "ACTIVITY", ["pool"], score=1.0, impressions=200),
        ScoredArm("e2", "STAY", ["luxury"], score=0.8, impressions=150),
    ]
    with_new = apply_new_listing_guarantee(established, scored_test)
    has_new = any(s.impressions < 50 for s in with_new)
    _test("guarantee inserts underexposed", has_new)

    # --- Test 5: Full pipeline ---
    print("\n🔗 Full rank pipeline")
    A = np.eye(D_PHI)
    b = np.zeros(D_PHI)
    ctx = UserContext(hour=14, month=7, scroll_depth=0.5, dwell_seconds=60)
    result = rank(test_arms, A, b, ctx, top_k=5)
    _test("returns list", isinstance(result, list))
    _test("respects top_k", len(result) <= 5)
    _test("all ScoredArm", all(isinstance(s, ScoredArm) for s in result))

    # --- Test 6: Margin sort ---
    print("\n💎 Margin sort")
    close_scores = [
        ScoredArm("m1", "ACTIVITY", [], score=1.0, commission_rate=0.05),
        ScoredArm("m2", "ACTIVITY", [], score=0.98, commission_rate=0.15),
        ScoredArm("m3", "STAY", [], score=0.5, commission_rate=0.20),
    ]
    sorted_margin = apply_margin_sort(close_scores)
    _test("top tier sorted by commission", sorted_margin[0].commission_rate >= sorted_margin[1].commission_rate)
    _test("separate tier preserved", sorted_margin[2].listing_id == "m3")

    # --- Summary ---
    total = passed + failed
    print(f"\n{'=' * 50}")
    print(f" Results: {passed}/{total} passed")
    print(f"{'=' * 50}\n")
    sys.exit(1 if failed > 0 else 0)
