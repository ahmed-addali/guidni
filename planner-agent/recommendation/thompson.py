"""
Thompson Sampling engine — core MAB algorithm.
Maintains Beta(α, β) distributions per arm, samples for ranking,
and updates on reward events.
"""

import logging
import numpy as np
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# ── Reward calibration ────────────────────────────────────────

REWARDS: dict[str, tuple[float, float]] = {
    # (alpha_delta, beta_delta)
    "impression":    (0.0,  0.1),   # β only — light penalty
    "click":         (0.2,  0.0),   # α only
    "dwell_time":    (0.3,  0.0),   # ≥15s on detail page
    "gallery_swipe": (0.2,  0.0),   # ≥3 photos swiped
    "wishlist":      (0.5,  0.0),
    "reservation":   (1.0,  0.0),
}

REVENUE_MULTIPLIER = 0.002  # revenue bonus for reservations


@dataclass
class ArmState:
    """In-memory representation of a BanditArm row."""
    listing_id: str
    listing_type: str
    segment: str
    alpha: float = 1.0
    beta: float = 1.0
    impressions: int = 0
    clicks: int = 0
    wishlists: int = 0
    conversions: int = 0
    total_revenue: float = 0.0


@dataclass
class ScoredArm:
    """An arm with its sampled θ value."""
    listing_id: str
    listing_type: str
    theta: float        # sampled from Beta(α, β)
    alpha: float
    beta: float
    impressions: int
    conversions: int


def sample_arms(arms: list[ArmState], top_k: int = 6) -> list[ScoredArm]:
    """
    Sample θ ~ Beta(α, β) for each arm and return top-K sorted by θ.
    This IS the explore-exploit magic: high-uncertainty arms get explored,
    proven arms get exploited.
    """
    scored = []
    for arm in arms:
        theta = float(np.random.beta(arm.alpha, arm.beta))
        scored.append(ScoredArm(
            listing_id=arm.listing_id,
            listing_type=arm.listing_type,
            theta=theta,
            alpha=arm.alpha,
            beta=arm.beta,
            impressions=arm.impressions,
            conversions=arm.conversions,
        ))

    scored.sort(key=lambda x: x.theta, reverse=True)
    top = scored[:top_k]

    # Log the sampling results
    logger.info("")
    logger.info("🎰 THOMPSON SAMPLING — %d arms → top %d", len(arms), top_k)
    logger.info("┌─── %-4s  %-15s  %-8s  %-8s  %-8s  %-6s  %-6s", "#", "LISTING_ID", "θ", "α", "β", "IMPR", "CONV")
    logger.info("│    %s", "-" * 70)
    for i, s in enumerate(top):
        logger.info(
            "│    %-4d  %-15s  %-8.4f  %-8.2f  %-8.2f  %-6d  %-6d",
            i + 1,
            s.listing_id[:15],
            s.theta,
            s.alpha,
            s.beta,
            s.impressions,
            s.conversions,
        )
    logger.info("└───")

    return top


def compute_reward(event_type: str, price: float = 0.0) -> tuple[float, float]:
    """
    Compute (alpha_delta, beta_delta) for a given event type.
    Reservation events get a revenue bonus proportional to price.
    """
    alpha_delta, beta_delta = REWARDS.get(event_type, (0.0, 0.0))

    # Revenue bonus for reservations
    if event_type == "reservation" and price > 0:
        alpha_delta += price * REVENUE_MULTIPLIER

    return alpha_delta, beta_delta


def get_counter_field(event_type: str) -> str | None:
    """Return which counter field to increment for this event type."""
    return {
        "impression": "impressions",
        "click": "clicks",
        "wishlist": "wishlists",
        "reservation": "conversions",
    }.get(event_type)


# ── Hybrid blending (global + user arms) ─────────────────────


def blend_and_sample(
    global_arms: list[ArmState],
    user_arms: list[ArmState],
    user_event_count: int,
    top_k: int = 8,
) -> list[ScoredArm]:
    """
    Hybrid Thompson Sampling: blend global arms with user-specific arms.

    The user weight grows from 0 → 0.8 as the user accumulates events:
      - 0 events  → 100% global (identical to anonymous)
      - 10 events → 25% user, 75% global
      - 20 events → 50% user, 50% global
      - 40+ events → 80% user, 20% global

    The blending is done at the θ-sample level:
      θ_final = (1 - w) × θ_global + w × θ_user
    """
    user_weight = min(0.8, user_event_count / 40.0)
    global_weight = 1.0 - user_weight

    logger.info("")
    logger.info("🔀 BLENDED SAMPLING — user_events=%d, weight=%.2f user / %.2f global",
                user_event_count, user_weight, global_weight)

    # Build user arm lookup
    user_map: dict[str, ArmState] = {}
    for arm in user_arms:
        key = f"{arm.listing_id}_{arm.listing_type}"
        user_map[key] = arm

    scored = []
    for arm in global_arms:
        theta_global = float(np.random.beta(arm.alpha, arm.beta))

        key = f"{arm.listing_id}_{arm.listing_type}"
        user_arm = user_map.get(key)

        if user_arm and user_weight > 0:
            theta_user = float(np.random.beta(user_arm.alpha, user_arm.beta))
            theta_final = global_weight * theta_global + user_weight * theta_user
        else:
            theta_final = theta_global

        scored.append(ScoredArm(
            listing_id=arm.listing_id,
            listing_type=arm.listing_type,
            theta=theta_final,
            alpha=user_arm.alpha if user_arm else arm.alpha,
            beta=user_arm.beta if user_arm else arm.beta,
            impressions=(user_arm.impressions if user_arm else 0) + arm.impressions,
            conversions=(user_arm.conversions if user_arm else 0) + arm.conversions,
        ))

    scored.sort(key=lambda x: x.theta, reverse=True)
    top = scored[:top_k]

    # Log
    logger.info("┌─── %-4s  %-15s  %-8s  %-8s  %-6s  %-6s", "#", "LISTING_ID", "θ_final", "type", "IMPR", "CONV")
    logger.info("│    %s", "-" * 60)
    for i, s in enumerate(top):
        logger.info(
            "│    %-4d  %-15s  %-8.4f  %-8s  %-6d  %-6d",
            i + 1, s.listing_id[:15], s.theta, s.listing_type, s.impressions, s.conversions,
        )
    logger.info("└───")

    return top
