"""Context — feature engineering for Hybrid LinUCB recommendation system.

Converts raw user signals (session data + profile history) into
feature vectors for LinUCB scoring.

LinUCB architecture:
    phi = x_user(d=9) ⊗ x_tags(d=40) → d_phi = 360

IMPORTANT: TAG_VOCAB order must NEVER change after first deploy —
doing so invalidates the global A matrix and b vector.
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# TAG_VOCAB — 40 binary tags for listing feature vectors
# ──────────────────────────────────────────────────────────────
# Alphabetical order — DO NOT reorder after first deploy.

TAG_VOCAB: list[str] = [
    "activity_indoor",
    "activity_outdoor",
    "adventure",
    "air_conditioning",
    "airport_transfer",
    "all_seasons",
    "bar",
    "beach_access",
    "best_evening",
    "best_morning",
    "best_summer",
    "best_winter",
    "budget",
    "business",
    "casual_dining",
    "city",
    "cultural",
    "family",
    "fine_dining",
    "garden",
    "gym",
    "hammam",
    "hostel",
    "hotel",
    "luxury",
    "mountain_view",
    "nature",
    "parking",
    "pool",
    "private_transfer",
    "riad",
    "romantic",
    "room_service",
    "sea_view",
    "solo",
    "spa",
    "street_food",
    "terrace",
    "villa",
    "wifi",
]

# Pre-compute index lookup for fast tag → position mapping
_TAG_INDEX: dict[str, int] = {tag: i for i, tag in enumerate(TAG_VOCAB)}

# ──────────────────────────────────────────────────────────────
# Dimension constants
# ──────────────────────────────────────────────────────────────

D_USER: int = 9
"""Dimension of x_user vector (session/profile features)."""

D_TAGS: int = len(TAG_VOCAB)  # 40
"""Dimension of x_tags vector (binary tag encoding)."""

D_PHI: int = D_USER * D_TAGS  # 360
"""Dimension of Kronecker product phi = x_user ⊗ x_tags."""

PLATFORM_MAX_PRICE: float = 2000.0
"""Max price for normalization (TND). Tuneable."""

# Verify dimensions at import time
assert D_TAGS == 40, f"TAG_VOCAB must have exactly 40 tags, got {D_TAGS}"
assert D_PHI == 360, f"D_PHI must be 360, got {D_PHI}"

# Trip type encoding map
_TRIP_TYPE_MAP: dict[str, float] = {
    "family": 1.0,
    "couple": 0.67,
    "solo": 0.33,
    "unknown": 0.0,
}


# ──────────────────────────────────────────────────────────────
# UserContext dataclass
# ──────────────────────────────────────────────────────────────

@dataclass
class UserContext:
    """User context aggregated from session signals and profile history.

    Combines real-time session data (device, scroll, dwell) with
    historical user preferences (tag affinity, booking patterns).
    """

    hour: int = 0
    """Current hour (0–23)."""

    month: int = 1
    """Current month (1–12)."""

    lat: Optional[float] = None
    """User latitude, None if unavailable."""

    lon: Optional[float] = None
    """User longitude, None if unavailable."""

    scroll_depth: float = 0.0
    """Scroll depth fraction (0.0–1.0)."""

    dwell_seconds: int = 0
    """Session dwell time in seconds."""

    budget_estimate: Optional[float] = None
    """Inferred from price_range_viewed, None if unknown."""

    device_type: str = "mobile"
    """Device type: 'mobile', 'desktop', 'tablet'."""

    tag_affinity: dict[str, float] = field(default_factory=dict)
    """From UserProfile: {'pool': 0.82, 'family': 0.6, ...}."""

    avg_booking_price: Optional[float] = None
    """Average booking price from UserProfile, None for anonymous."""

    dominant_trip_type: str = "unknown"
    """From UserProfile: 'family', 'couple', 'solo', or 'unknown'."""


# ──────────────────────────────────────────────────────────────
# build_user_vector
# ──────────────────────────────────────────────────────────────

def build_user_vector(ctx: UserContext) -> np.ndarray:
    """Convert a UserContext into a 9-dimensional feature vector.

    Feature order (fixed — do not change):
        [0] sin(2π × hour/24)
        [1] cos(2π × hour/24)
        [2] sin(2π × month/12)
        [3] cos(2π × month/12)
        [4] clip(scroll_depth, 0, 1)
        [5] clip(log1p(dwell_seconds) / log1p(300), 0, 1)
        [6] price_affinity_norm (0 if no booking history)
        [7] top_tag_affinity_score (0 if no affinities)
        [8] trip_type_encoded (family=1, couple=0.67, solo=0.33, unknown=0)

    Args:
        ctx: The user context to encode.

    Returns:
        np.ndarray of shape (9,) with dtype float64.
    """
    two_pi = 2.0 * math.pi

    x = np.array([
        # [0,1] cyclic hour encoding
        math.sin(two_pi * ctx.hour / 24.0),
        math.cos(two_pi * ctx.hour / 24.0),
        # [2,3] cyclic month encoding
        math.sin(two_pi * ctx.month / 12.0),
        math.cos(two_pi * ctx.month / 12.0),
        # [4] scroll depth
        float(np.clip(ctx.scroll_depth, 0.0, 1.0)),
        # [5] dwell time (log-scaled, capped at 300s baseline)
        float(np.clip(
            math.log1p(ctx.dwell_seconds) / math.log1p(300),
            0.0, 1.0,
        )),
        # [6] price affinity
        0.0 if ctx.avg_booking_price is None else float(np.clip(
            ctx.avg_booking_price / PLATFORM_MAX_PRICE, 0.0, 1.0,
        )),
        # [7] top tag affinity score
        0.0 if not ctx.tag_affinity else float(1.0 - math.exp(-max(ctx.tag_affinity.values()))),
        # [8] trip type
        _TRIP_TYPE_MAP.get(ctx.dominant_trip_type, 0.0),
    ], dtype=np.float64)

    # Safety: replace any NaN/inf with 0.0
    x = np.nan_to_num(x, nan=0.0, posinf=0.0, neginf=0.0)
    
    logger.debug(
        "User Vector Built: scroll=%.2f, dwell=%ds, hour=%d, month=%d, budget_est=%s, device=%s",
        ctx.scroll_depth, ctx.dwell_seconds, ctx.hour, ctx.month, ctx.budget_estimate, ctx.device_type
    )
    logger.debug(
        "User Vector (x_user): %s", np.array2string(x, precision=4, suppress_small=True)
    )
    
    return x


# ──────────────────────────────────────────────────────────────
# build_phi
# ──────────────────────────────────────────────────────────────

def build_phi(x_user: np.ndarray, tags: list[str]) -> np.ndarray:
    """Compute the Kronecker product feature vector phi = x_user ⊗ x_tags.

    Args:
        x_user: User feature vector of shape (D_USER,) = (9,).
        tags: List of tag strings present on this listing.

    Returns:
        np.ndarray of shape (D_PHI,) = (360,) with dtype float64.
    """
    # Build binary tag vector
    x_tags = np.zeros(D_TAGS, dtype=np.float64)
    for tag in tags:
        idx = _TAG_INDEX.get(tag)
        if idx is not None:
            x_tags[idx] = 1.0

    # Kronecker product
    phi = np.kron(x_user, x_tags)

    # Safety: replace any NaN/inf with 0.0
    phi = np.nan_to_num(phi, nan=0.0, posinf=0.0, neginf=0.0)
    
    logger.debug("Phi Matrix Built for tags %s (norm: %.4f)", tags[:3], float(np.linalg.norm(phi)))
    
    return phi


# ──────────────────────────────────────────────────────────────
# build_price_match
# ──────────────────────────────────────────────────────────────

def build_price_match(
    listing_price: float,
    budget_estimate: Optional[float],
    listing_tags: list[str] = [],
    user_tag_affinity: dict[str, float] = {},
) -> float:
    """Score how well a listing's price matches the user's budget.

    Returns a value in [-1.0, 1.5]:
        - Positive = good match (under budget, tag overlap)
        - Negative = over budget

    Args:
        listing_price: Listing price in TND.
        budget_estimate: User's estimated budget, None if unknown.
        listing_tags: Tags on this listing.
        user_tag_affinity: User's tag affinity dict.

    Returns:
        Float score clipped to [-1.0, 1.5].
    """
    if budget_estimate is None or budget_estimate <= 0:
        return 0.0

    ratio = listing_price / budget_estimate

    if ratio <= 0.8:
        base = 1.0
    elif ratio <= 1.0:
        base = 0.5
    elif ratio <= 1.2:
        base = -0.3
    else:
        base = -1.0

    # Tag overlap bonus
    if listing_tags:
        tag_overlap = sum(
            user_tag_affinity.get(t, 0.0) for t in listing_tags
        ) / len(listing_tags)
    else:
        tag_overlap = 0.0

    final = base * (1.0 + 0.2 * tag_overlap)
    return float(np.clip(final, -1.0, 1.5))


# ──────────────────────────────────────────────────────────────
# compute_vocab_hash
# ──────────────────────────────────────────────────────────────

def compute_vocab_hash(vocab: list[str]) -> str:
    """Compute SHA-256 hash of the sorted tag vocabulary.

    Used for deploy-time safety checks — ensures the A matrix
    and the TAG_VOCAB are in sync.

    Args:
        vocab: Tag vocabulary list (will be sorted before hashing).

    Returns:
        Hex digest string (64 chars).
    """
    return hashlib.sha256(
        json.dumps(sorted(vocab)).encode("utf-8")
    ).hexdigest()


# ──────────────────────────────────────────────────────────────
# build_context_from_profile
# ──────────────────────────────────────────────────────────────

def build_context_from_profile(
    profile: dict | None,
    session: dict,
) -> UserContext:
    """Merge historical user profile with current session data.

    For anonymous users (profile=None), builds context from session
    signals only — features [6], [7], [8] will be 0.0.

    Args:
        profile: UserProfile row as dict, or None for anonymous.
            Expected keys: tag_affinity, avg_booking_price,
            dominant_trip_type, total_bookings.
        session: Session data dict.
            Expected keys: hour, month, lat, lon, scroll_depth,
            dwell_seconds, price_range_viewed, device_type.

    Returns:
        Fully populated UserContext dataclass.
    """
    # Extract session fields with safe defaults
    price_range = session.get("price_range_viewed", {})
    if isinstance(price_range, str):
        try:
            price_range = json.loads(price_range)
        except (json.JSONDecodeError, TypeError):
            price_range = {}

    price_min = float(price_range.get("min", 0))
    price_max = float(price_range.get("max", 0))
    budget_estimate: float | None = None
    if price_max > 0:
        budget_estimate = (price_min + price_max) / 2.0

    ctx = UserContext(
        hour=int(session.get("hour", session.get("entry_hour", 0))),
        month=int(session.get("month", session.get("entry_month", 1))),
        lat=session.get("lat", session.get("location_lat")),
        lon=session.get("lon", session.get("location_lon")),
        scroll_depth=float(session.get("scroll_depth", session.get("scroll_depth_max", 0.0))),
        dwell_seconds=int(session.get("dwell_seconds", 0)),
        budget_estimate=budget_estimate,
        device_type=str(session.get("device_type", "mobile")),
    )

    # Merge profile data (if logged-in user)
    if profile is not None:
        tag_aff = profile.get("tag_affinity", {})
        if isinstance(tag_aff, str):
            try:
                tag_aff = json.loads(tag_aff)
            except (json.JSONDecodeError, TypeError):
                tag_aff = {}
        ctx.tag_affinity = tag_aff
        ctx.avg_booking_price = profile.get("avg_booking_price")
        ctx.dominant_trip_type = str(profile.get("dominant_trip_type", "unknown"))

    return ctx


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
    print(" context.py — Unit Tests")
    print("=" * 50)

    # --- Test 1: TAG_VOCAB ---
    print("\n📋 TAG_VOCAB")
    _test("has 40 tags", len(TAG_VOCAB) == 40)
    _test("is sorted", TAG_VOCAB == sorted(TAG_VOCAB))
    _test("D_PHI == 360", D_PHI == 360)
    _test("vocab hash is stable", len(compute_vocab_hash(TAG_VOCAB)) == 64)

    # --- Test 2: build_user_vector shape ---
    print("\n🔢 build_user_vector")
    ctx = UserContext(hour=14, month=7, scroll_depth=0.5, dwell_seconds=120)
    x = build_user_vector(ctx)
    _test("shape is (9,)", x.shape == (9,))
    _test("dtype is float64", x.dtype == np.float64)
    _test("all finite", np.all(np.isfinite(x)))

    # --- Test 3: anonymous user ---
    print("\n👤 Anonymous user (no profile)")
    anon = UserContext()
    x_anon = build_user_vector(anon)
    _test("feature[6] (price) = 0.0", x_anon[6] == 0.0)
    _test("feature[7] (affinity) = 0.0", x_anon[7] == 0.0)
    _test("feature[8] (trip type) = 0.0", x_anon[8] == 0.0)

    # --- Test 4: build_phi shape ---
    print("\n🧮 build_phi")
    phi = build_phi(x, ["pool", "luxury", "wifi"])
    _test("phi shape is (360,)", phi.shape == (D_PHI,))
    _test("phi all finite", np.all(np.isfinite(phi)))

    # --- Test 5: NaN injection resilience ---
    print("\n🛡️ NaN/inf resilience")
    ctx_bad = UserContext(
        hour=14, month=7, scroll_depth=float("nan"),
        dwell_seconds=0, avg_booking_price=float("inf"),
        tag_affinity={"pool": float("nan")},
    )
    x_bad = build_user_vector(ctx_bad)
    _test("NaN in scroll → 0.0", np.all(np.isfinite(x_bad)))
    phi_bad = build_phi(x_bad, ["pool"])
    _test("phi after NaN injection all finite", np.all(np.isfinite(phi_bad)))

    # --- Test 6: build_price_match ---
    print("\n💰 build_price_match")
    _test("None budget → 0.0", build_price_match(100, None) == 0.0)
    _test("zero budget → 0.0", build_price_match(100, 0) == 0.0)
    _test("perfect match (ratio=0.7) → ~1.0", build_price_match(70, 100) == 1.0)
    _test("over budget (ratio=1.5) → -1.0", build_price_match(150, 100) == -1.0)
    pm_with_tags = build_price_match(70, 100, ["pool"], {"pool": 0.9})
    _test("tag overlap boosts score", pm_with_tags > 1.0)

    # --- Test 7: build_context_from_profile ---
    print("\n🔗 build_context_from_profile")
    ctx_merged = build_context_from_profile(
        profile={"tag_affinity": {"pool": 0.8}, "avg_booking_price": 150.0, "dominant_trip_type": "family"},
        session={"hour": 14, "month": 6, "scroll_depth": 0.7, "dwell_seconds": 60,
                 "price_range_viewed": {"min": 50, "max": 200}, "device_type": "desktop"},
    )
    _test("hour from session", ctx_merged.hour == 14)
    _test("tag_affinity from profile", ctx_merged.tag_affinity.get("pool") == 0.8)
    _test("budget from price_range", ctx_merged.budget_estimate == 125.0)
    _test("trip type from profile", ctx_merged.dominant_trip_type == "family")

    ctx_anon = build_context_from_profile(None, {"hour": 10, "month": 3})
    _test("anonymous has no affinity", ctx_anon.tag_affinity == {})

    # --- Summary ---
    total = passed + failed
    print(f"\n{'=' * 50}")
    print(f" Results: {passed}/{total} passed")
    print(f"{'=' * 50}\n")
    sys.exit(1 if failed > 0 else 0)
