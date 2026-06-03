"""
Hybrid scorer — combines RAG vector similarity score with
domain-specific travel logic for final ranking.

Weight split: 60% RAG (semantic relevance) + 40% domain (travel rules).
"""

import logging

from models.plan_item import ScoredPlanItem
from models.preferences import UserPreferences

logger = logging.getLogger(__name__)


# ── Interest-related tag sets ─────────────────────────────────

ROMANTIC_TAGS = {"romantic", "sea_view", "rooftop", "cosy", "sunset", "candlelit"}
FAMILY_TAGS = {"family", "kids", "children", "playground", "family_friendly", "all-ages"}
FRIENDS_TAGS = {"live_music", "nightlife", "party", "group", "social", "fun"}
ADVENTURE_TAGS = {"adventure", "extreme", "adrenaline", "outdoor", "climbing", "hiking"}

# RAG vs domain weight (sums to 1.0)
RAG_WEIGHT = 0.6
DOMAIN_WEIGHT = 0.4


def apply_hybrid_scoring(
    items: list[ScoredPlanItem],
    prefs: UserPreferences,
) -> list[ScoredPlanItem]:
    """
    Re-rank a list of RAG-scored items with domain-specific bonuses.
    Mutates the score fields and returns sorted list.
    """
    if not items:
        return items

    entity_type = items[0].type if items else "?"
    logger.info("")
    logger.info("⚖️  HYBRID SCORING [%s] — %d items (%.0f%% RAG + %.0f%% Domain)",
                entity_type, len(items), RAG_WEIGHT * 100, DOMAIN_WEIGHT * 100)

    for item in items:
        domain_score = _compute_domain_score(item, prefs)
        item.domain_score = domain_score
        item.rag_score = item.score  # preserve original RAG score
        item.score = (item.rag_score * RAG_WEIGHT) + (domain_score * DOMAIN_WEIGHT)

    items.sort(key=lambda x: x.score, reverse=True)

    # Log final ranking table
    logger.info("┌─── FINAL RANKING [%s] — after hybrid scoring ───", entity_type)
    logger.info("│ %-4s  %-30s  %-8s  %-8s  %-8s  %s", "#", "NAME", "FINAL", "RAG", "DOMAIN", "WHY DOMAIN")
    logger.info("│ %s", "-" * 80)
    for i, item in enumerate(items):
        why = _explain_domain(item, prefs)
        logger.info(
            "│ %-4d  %-30s  %-8.4f  %-8.4f  %-8.4f  %s",
            i + 1,
            (item.name or "?")[:30],
            item.score,
            item.rag_score,
            item.domain_score,
            why,
        )
    logger.info("└───")

    return items


def _explain_domain(item: ScoredPlanItem, prefs: UserPreferences) -> str:
    """Generate a short human-readable explanation of domain score bonuses."""
    reasons = []
    tags_set = set(item.tags or [])
    attrs_set = set(item.attributes or [])
    combined = tags_set | attrs_set

    if prefs.group_type == "couple" and combined & ROMANTIC_TAGS:
        reasons.append(f"romantic({','.join(combined & ROMANTIC_TAGS)})")
    if prefs.group_type == "family" and item.family_friendly:
        reasons.append("family-ok")
    if prefs.group_type == "family" and combined & FAMILY_TAGS:
        reasons.append(f"fam-tags({','.join(combined & FAMILY_TAGS)})")
    if prefs.group_type == "friends" and combined & FRIENDS_TAGS:
        reasons.append(f"friend-tags({','.join(combined & FRIENDS_TAGS)})")

    interest_match = tags_set & set(prefs.interests)
    if interest_match:
        reasons.append(f"interests({','.join(interest_match)})")

    if item.nb_reviews and item.nb_reviews > 5:
        reasons.append(f"popular({item.nb_reviews}r)")
    if item.rating and item.rating >= 4.0:
        reasons.append(f"rated({item.rating})")

    if prefs.budget == 1 and item.price == 0:
        reasons.append("free!")

    return " | ".join(reasons) if reasons else "base-only"


def _compute_domain_score(item: ScoredPlanItem, prefs: UserPreferences) -> float:
    """
    Compute a 0–1 normalized domain score based on travel-specific rules
    that vector embeddings cannot capture.
    """
    score = 0.0
    tags_set = set(item.tags or [])
    attrs_set = set(item.attributes or [])
    combined = tags_set | attrs_set

    # ── 1. Group type compatibility (max 0.3) ─────────────────
    if prefs.group_type == "couple":
        couple_match = len(combined & ROMANTIC_TAGS)
        score += min(couple_match * 0.1, 0.3)
        if item.intensity == "low":
            score += 0.05

    elif prefs.group_type == "family":
        family_match = len(combined & FAMILY_TAGS)
        score += min(family_match * 0.1, 0.3)
        if item.family_friendly:
            score += 0.15

    elif prefs.group_type == "friends":
        friends_match = len(combined & FRIENDS_TAGS)
        score += min(friends_match * 0.1, 0.25)
        if item.intensity in ("medium", "high"):
            score += 0.05

    elif prefs.group_type == "solo":
        if item.intensity in ("low", "medium"):
            score += 0.05

    # ── 2. Travel style × intensity alignment (max 0.2) ───────
    intensity_map = {"low": 1, "medium": 2, "high": 3}
    style_map = {"relaxed": 1, "balanced": 2, "active": 3}
    item_val = intensity_map.get(item.intensity or "medium", 2)
    target_val = style_map.get(prefs.travel_style, 2)
    diff = abs(item_val - target_val)
    score += (3 - diff) * 0.067  # max = 0.2 when diff=0

    # ── 3. Direct interest match (max 0.25) ───────────────────
    interest_match = len(tags_set & set(prefs.interests))
    score += min(interest_match * 0.08, 0.25)

    # ── 4. Popularity proxy (max 0.15) ────────────────────────
    reviews = item.nb_reviews or 0
    rating = item.rating or 0.0
    score += min(reviews * 0.003, 0.08)
    score += min(rating * 0.014, 0.07)  # 5.0 rating → 0.07

    # ── 5. Free items bonus for budget travelers (max 0.1) ────
    if prefs.budget == 1 and item.price == 0:
        score += 0.1
    elif prefs.budget == 1 and item.price <= 30:
        score += 0.05

    return min(score, 1.0)


def apply_restaurant_hybrid_scoring(
    items: list[ScoredPlanItem],
    prefs: UserPreferences,
    slot: str = "lunch",
) -> list[ScoredPlanItem]:
    """
    Extended hybrid scoring for restaurants — adds meal + attribute bonuses.
    """
    if not items:
        return items

    logger.info("")
    logger.info("⚖️  HYBRID SCORING [RESTAURANT/%s] — %d items", slot.upper(), len(items))

    for item in items:
        domain_score = _compute_domain_score(item, prefs)

        # Meal compatibility bonus
        meals = item.meals or []
        meal_bonus = ""
        if slot == "lunch" and "Lunch" in meals:
            domain_score += 0.15
            meal_bonus = "+lunch"
        if slot == "evening" and ("Dinner" in meals or "All day" in meals):
            domain_score += 0.15
            meal_bonus = "+dinner"

        # Specific attribute bonuses
        attrs = set(item.attributes or [])
        attr_bonus = ""
        if prefs.group_type == "couple" and "romantic" in attrs:
            domain_score += 0.2
            attr_bonus = "+romantic"
        if prefs.group_type == "family" and "family_friendly" in attrs:
            domain_score += 0.15
            attr_bonus = "+family"
        if prefs.group_type == "friends" and "live_music" in attrs:
            domain_score += 0.12
            attr_bonus = "+live_music"

        domain_score = min(domain_score, 1.0)
        item.domain_score = domain_score
        item.rag_score = item.score
        item.score = (item.rag_score * RAG_WEIGHT) + (domain_score * DOMAIN_WEIGHT)

    items.sort(key=lambda x: x.score, reverse=True)

    # Log final ranking
    logger.info("┌─── FINAL RANKING [RESTAURANT/%s] ───", slot.upper())
    logger.info("│ %-4s  %-30s  %-8s  %-8s  %-8s  %-20s  %s",
                "#", "NAME", "FINAL", "RAG", "DOMAIN", "MEALS", "ATTRS")
    logger.info("│ %s", "-" * 90)
    for i, item in enumerate(items):
        logger.info(
            "│ %-4d  %-30s  %-8.4f  %-8.4f  %-8.4f  %-20s  %s",
            i + 1,
            (item.name or "?")[:30],
            item.score,
            item.rag_score,
            item.domain_score,
            ", ".join(item.meals or [])[:20],
            ", ".join((item.attributes or [])[:4]),
        )
    logger.info("└───")

    return items
