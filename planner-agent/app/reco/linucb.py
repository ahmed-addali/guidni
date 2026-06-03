"""LinUCB — scoring engine and matrix operations for Hybrid LinUCB.

Implements:
    - LinUCB scoring with UCB exploration bonus
    - Matrix update rule: A += phi phi^T, b += r * phi
    - Reward computation with session-level dedup
    - Matrix health checks and partial reset for concept drift
    - DB persistence via psycopg2 (load/save global matrices)
"""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass, field
from math import log2, sqrt
from typing import Optional

import numpy as np

from app.reco.context import TAG_VOCAB, D_PHI, compute_vocab_hash

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────

UCB_ALPHA: float = 0.3
"""Exploration parameter (tuneable). Higher = more exploration."""

UNDEREXPOSED_BONUS: float = 0.15
"""Extra UCB bonus for listings with impressions < 50."""

REWARDS: dict[str, float] = {
    "impression":     0.0,
    "click":          0.3,
    "dwell_30s":      0.5,
    "dwell_60s":      0.7,
    "gallery_swipe":  0.4,
    "scroll_reviews": 0.6,
    "wishlist":       0.85,
    "reservation":    1.0,
    "quick_exit":    -0.2,
}


# ──────────────────────────────────────────────────────────────
# Dataclasses
# ──────────────────────────────────────────────────────────────

@dataclass
class ArmState:
    """Per-listing arm state loaded from BanditArmUCB table."""

    listing_id: str
    listing_type: str
    location_zone: str
    tags: list[str] = field(default_factory=list)
    impressions: int = 0
    clicks: int = 0
    wishlists: int = 0
    conversions: int = 0
    total_revenue: float = 0.0
    price: float = 0.0
    commission_rate: float = 0.10
    is_underexposed: bool = True


@dataclass
class ScoredArm:
    """Scored arm result from LinUCB ranking."""

    listing_id: str
    listing_type: str
    tags: list[str] = field(default_factory=list)
    score: float = 0.0
    exploitation: float = 0.0
    ucb_bonus: float = 0.0
    position_discount: float = 1.0
    impressions: int = 0
    conversions: int = 0
    commission_rate: float = 0.10


# ──────────────────────────────────────────────────────────────
# validate_phi
# ──────────────────────────────────────────────────────────────

def validate_phi(phi: np.ndarray, listing_id: str = "") -> np.ndarray:
    """Validate and clean a phi feature vector.

    Args:
        phi: Feature vector to validate.
        listing_id: Optional listing ID for logging.

    Returns:
        Cleaned phi of shape (D_PHI,).

    Raises:
        ValueError: If phi has wrong shape.
    """
    if phi.shape != (D_PHI,):
        raise ValueError(
            f"phi has shape {phi.shape}, expected ({D_PHI},)"
            + (f" for listing {listing_id}" if listing_id else "")
        )

    if not np.all(np.isfinite(phi)):
        bad_count = int(np.sum(~np.isfinite(phi)))
        logger.warning(
            "phi contains %d non-finite values%s — replacing with 0.0",
            bad_count,
            f" (listing={listing_id})" if listing_id else "",
        )
        phi = np.nan_to_num(phi, nan=0.0, posinf=0.0, neginf=0.0)

    return phi


# ──────────────────────────────────────────────────────────────
# score_arms
# ──────────────────────────────────────────────────────────────

def score_arms(
    arms: list[ArmState],
    phi_per_arm: dict[str, np.ndarray],
    A: np.ndarray,
    b: np.ndarray,
    alpha: float = UCB_ALPHA,
    rank_shown: dict[str, int] | None = None,
) -> list[ScoredArm]:
    """Score all arms using LinUCB with UCB exploration bonus.

    Uses np.linalg.solve (never inv) for numerical stability.
    Adds UNDEREXPOSED_BONUS for arms with few impressions.

    Args:
        arms: List of arm states to score.
        phi_per_arm: Pre-computed phi vectors keyed by listing_id.
        A: Global A matrix of shape (D_PHI, D_PHI).
        b: Global b vector of shape (D_PHI,).
        alpha: UCB exploration parameter.
        rank_shown: Optional mapping of listing_id → previous rank position.

    Returns:
        List of ScoredArm sorted descending by score.
    """
    # Compute theta_hat = A^{-1} b via solve (more stable than inv)
    try:
        theta_hat = np.linalg.solve(A, b)
    except np.linalg.LinAlgError:
        logger.error("A matrix is singular — falling back to lstsq")
        theta_hat, _, _, _ = np.linalg.lstsq(A, b, rcond=None)

    scored: list[ScoredArm] = []

    for arm in arms:
        if arm.listing_id not in phi_per_arm:
            logger.debug("No phi for listing %s — skipping", arm.listing_id)
            continue

        phi = validate_phi(phi_per_arm[arm.listing_id], arm.listing_id)

        # Exploitation: theta^T phi
        exploitation = float(theta_hat @ phi)

        # UCB variance: phi^T A^{-1} phi via solve
        try:
            A_inv_phi = np.linalg.solve(A, phi)
            variance = float(phi @ A_inv_phi)
        except np.linalg.LinAlgError:
            variance = 0.0
            logger.warning("Solve failed for UCB variance — listing %s", arm.listing_id)

        ucb_bonus = alpha * sqrt(max(variance, 0.0))

        # Underexposed bonus
        if arm.is_underexposed:
            ucb_bonus += UNDEREXPOSED_BONUS

        # Position discount (IPS-style correction)
        position_discount = 1.0
        if rank_shown and arm.listing_id in rank_shown:
            pos = rank_shown[arm.listing_id]
            position_discount = 1.0 / log2(pos + 1) if pos > 0 else 1.0

        score = (exploitation + ucb_bonus) * position_discount

        scored.append(ScoredArm(
            listing_id=arm.listing_id,
            listing_type=arm.listing_type,
            tags=arm.tags,
            score=score,
            exploitation=exploitation,
            ucb_bonus=ucb_bonus,
            position_discount=position_discount,
            impressions=arm.impressions,
            conversions=arm.conversions,
            commission_rate=arm.commission_rate,
        ))

        logger.debug(
            "LinUCB Calc | id=%s: exp=%.4f, var=%.4f, ucb=%.4f, p_disc=%.2f, FINAL=%.4f",
            arm.listing_id, exploitation, variance, ucb_bonus, position_discount, score
        )

    # Sort descending by score
    scored.sort(key=lambda s: s.score, reverse=True)
    return scored


# ──────────────────────────────────────────────────────────────
# update
# ──────────────────────────────────────────────────────────────

def update(
    phi: np.ndarray,
    reward: float,
    A: np.ndarray,
    b: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Apply LinUCB update rule: A += phi phi^T, b += r * phi.

    Args:
        phi: Feature vector of shape (D_PHI,).
        reward: Scalar reward signal.
        A: Current A matrix of shape (D_PHI, D_PHI).
        b: Current b vector of shape (D_PHI,).

    Returns:
        Tuple of (A_new, b_new).
    """
    phi = validate_phi(phi)
    A_new = A + np.outer(phi, phi)
    b_new = b + reward * phi
    return A_new, b_new


# ──────────────────────────────────────────────────────────────
# compute_reward
# ──────────────────────────────────────────────────────────────

def compute_reward(
    event_type: str,
    dwell_seconds: int = 0,
    session_rewards: dict[str, float] | None = None,
    listing_id: str = "",
) -> float:
    """Compute the reward signal for an event.

    Handles dwell time thresholds and session-level dedup
    (only emits the delta above previous max reward for a listing).

    Args:
        event_type: Event type string (e.g. 'click', 'wishlist').
        dwell_seconds: Dwell time for dwell_exit events.
        session_rewards: Mutable dict tracking max reward per listing in session.
        listing_id: Listing ID for session dedup.

    Returns:
        Reward value (may be 0.0 if already exceeded by prior event).
    """
    raw = REWARDS.get(event_type, 0.0)

    # Handle dwell_exit with time thresholds
    if event_type == "dwell_exit":
        if dwell_seconds >= 60:
            raw = 0.7
        elif dwell_seconds >= 30:
            raw = 0.5
        else:
            raw = 0.1

    # Session-level MAX reward dedup (prevents double-counting)
    if session_rewards is not None and listing_id:
        previous_max = session_rewards.get(listing_id, 0.0)
        effective = max(raw, previous_max)
        session_rewards[listing_id] = effective
        return effective - previous_max  # only the delta

    return raw


# ──────────────────────────────────────────────────────────────
# is_matrix_healthy
# ──────────────────────────────────────────────────────────────

def is_matrix_healthy(A: np.ndarray) -> bool:
    """Check if the A matrix is numerically healthy.

    A healthy matrix is:
    - Finite (no NaN/inf)
    - Correct shape (D_PHI × D_PHI)
    - Positive definite (min eigenvalue > 0)

    Args:
        A: Matrix to check.

    Returns:
        True if healthy, False otherwise.
    """
    if A.shape != (D_PHI, D_PHI):
        logger.warning("A matrix shape %s != (%d, %d)", A.shape, D_PHI, D_PHI)
        return False

    if not np.all(np.isfinite(A)):
        non_finite = int(np.sum(~np.isfinite(A)))
        logger.warning("A matrix has %d non-finite values", non_finite)
        return False

    try:
        min_eigenvalue = float(np.linalg.eigvalsh(A).min())
        if min_eigenvalue <= 0:
            logger.warning(
                "A matrix not positive definite — min eigenvalue = %.6e",
                min_eigenvalue,
            )
            return False
    except np.linalg.LinAlgError as e:
        logger.warning("Eigenvalue computation failed: %s", e)
        return False

    return True


# ──────────────────────────────────────────────────────────────
# partial_reset
# ──────────────────────────────────────────────────────────────

def partial_reset(
    A: np.ndarray,
    b: np.ndarray,
    lambda_decay: float = 0.7,
) -> tuple[np.ndarray, np.ndarray]:
    """Partial reset of global matrices for concept drift.

    Blends current matrices with identity/zero priors:
        A_new = λ × A + (1−λ) × I
        b_new = λ × b

    Called by nightly job every 90 days.

    Args:
        A: Current A matrix.
        b: Current b vector.
        lambda_decay: Decay factor (0–1). Higher = retain more history.

    Returns:
        Tuple of (A_new, b_new).
    """
    A_new = lambda_decay * A + (1.0 - lambda_decay) * np.eye(D_PHI)
    b_new = lambda_decay * b
    return A_new, b_new


# ──────────────────────────────────────────────────────────────
# DB persistence
# ──────────────────────────────────────────────────────────────

def load_global_matrices(
    conn=None,
) -> tuple[np.ndarray, np.ndarray]:
    """Load the global A matrix and b vector from LinUCBGlobal.

    Verifies vocab_hash matches the current TAG_VOCAB.
    Falls back to fresh identity/zero matrices if unhealthy.

    Args:
        conn: Optional psycopg2 connection (acquired from pool if None).

    Returns:
        Tuple of (A, b) as numpy arrays.

    Raises:
        RuntimeError: If vocab_hash mismatch detected.
    """
    from app.reco.db_init import _get_conn, _return_conn
    from psycopg2.extras import RealDictCursor

    c, owned = _get_conn(conn)
    try:
        with c.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "a_matrix", "b_vector", "d", "vocab_hash" '
                'FROM "LinUCBGlobal" WHERE "id" = %s',
                ("global",),
            )
            row = cur.fetchone()

        if row is None:
            logger.info("LinUCBGlobal empty — returning fresh matrices")
            return np.eye(D_PHI), np.zeros(D_PHI)

        # Verify vocab hash
        stored_hash = row["vocab_hash"]
        current_hash = compute_vocab_hash(TAG_VOCAB)
        if stored_hash and stored_hash != current_hash:
            raise RuntimeError(
                f"TAG_VOCAB changed — stored hash={stored_hash[:12]}... "
                f"current hash={current_hash[:12]}... "
                f"Reset A,b first!"
            )

        # Deserialize matrices
        a_data = row["a_matrix"]
        b_data = row["b_vector"]

        # Handle both list and string representations
        if isinstance(a_data, str):
            a_data = json.loads(a_data)
        if isinstance(b_data, str):
            b_data = json.loads(b_data)

        A = np.array(a_data, dtype=np.float64)
        b = np.array(b_data, dtype=np.float64)

        # Check dimensions
        stored_d = row["d"]
        if A.shape != (stored_d, stored_d) or b.shape != (stored_d,):
            logger.error(
                "Dimension mismatch: A=%s, b=%s, stored d=%d",
                A.shape, b.shape, stored_d,
            )
            return np.eye(D_PHI), np.zeros(D_PHI)

        # Health check
        if not is_matrix_healthy(A):
            logger.critical(
                "A matrix is UNHEALTHY — returning fresh identity matrix. "
                "Previous A had shape %s, min eigenvalue check failed.",
                A.shape,
            )
            return np.eye(D_PHI), np.zeros(D_PHI)

        logger.info(
            "Loaded global matrices: A=%s, b=%s, d=%d",
            A.shape, b.shape, stored_d,
        )
        return A, b

    except RuntimeError:
        raise
    except Exception as e:
        logger.error("load_global_matrices error: %s", e, exc_info=True)
        return np.eye(D_PHI), np.zeros(D_PHI)
    finally:
        if owned:
            _return_conn(c)


def save_global_matrices(
    A: np.ndarray,
    b: np.ndarray,
    conn=None,
) -> None:
    """Save the global A matrix and b vector to LinUCBGlobal.

    Upserts the single 'global' row and increments n_updates.

    Args:
        A: A matrix of shape (D_PHI, D_PHI).
        b: b vector of shape (D_PHI,).
        conn: Optional psycopg2 connection.
    """
    from app.reco.db_init import _get_conn, _return_conn

    c, owned = _get_conn(conn)
    try:
        vocab_hash = compute_vocab_hash(TAG_VOCAB)
        sql = """
            INSERT INTO "LinUCBGlobal" (
                "id", "a_matrix", "b_vector", "d",
                "vocab_hash", "n_updates", "updated_at"
            ) VALUES (
                'global', %s::jsonb, %s::jsonb, %s,
                %s, 1, now()
            )
            ON CONFLICT ("id") DO UPDATE SET
                "a_matrix" = EXCLUDED."a_matrix",
                "b_vector" = EXCLUDED."b_vector",
                "d" = EXCLUDED."d",
                "vocab_hash" = EXCLUDED."vocab_hash",
                "n_updates" = "LinUCBGlobal"."n_updates" + 1,
                "updated_at" = now()
        """
        with c.cursor() as cur:
            cur.execute(sql, (
                json.dumps(A.tolist()),
                json.dumps(b.tolist()),
                D_PHI,
                vocab_hash,
            ))
        c.commit()
        logger.debug("Saved global matrices (d=%d)", D_PHI)
    except Exception as e:
        c.rollback()
        logger.error("save_global_matrices error: %s", e)
        raise
    finally:
        if owned:
            _return_conn(c)


def save_global_matrices_async(A: np.ndarray, b: np.ndarray) -> None:
    """Save global matrices in a daemon thread (non-blocking).

    Used after batch processing so the scoring path is not blocked.

    Args:
        A: A matrix.
        b: b vector.
    """
    # Copy arrays to avoid mutation during async write
    A_copy = A.copy()
    b_copy = b.copy()

    def _worker():
        try:
            save_global_matrices(A_copy, b_copy)
        except Exception as e:
            logger.error("Async save_global_matrices failed: %s", e)

    t = threading.Thread(target=_worker, daemon=True, name="linucb-save")
    t.start()
    logger.debug("save_global_matrices_async dispatched")


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
    print(" linucb.py — Unit Tests")
    print("=" * 50)

    # --- Test 1: validate_phi ---
    print("\n🔍 validate_phi")
    good_phi = np.random.randn(D_PHI)
    cleaned = validate_phi(good_phi)
    _test("valid phi passes", cleaned.shape == (D_PHI,))

    bad_phi = np.random.randn(D_PHI)
    bad_phi[0] = float("nan")
    bad_phi[10] = float("inf")
    cleaned_bad = validate_phi(bad_phi, "test-id")
    _test("NaN/inf cleaned", np.all(np.isfinite(cleaned_bad)))

    try:
        validate_phi(np.zeros(100))
        _test("wrong shape raises", False)
    except ValueError:
        _test("wrong shape raises", True)

    # --- Test 2: score_arms ---
    print("\n📊 score_arms")
    A = np.eye(D_PHI)
    b = np.zeros(D_PHI)
    arms = [
        ArmState("a1", "ACTIVITY", "Djerba", ["pool", "beach_access"], impressions=100, is_underexposed=False),
        ArmState("a2", "STAY", "Djerba", ["luxury", "spa"], impressions=10, is_underexposed=True),
    ]
    phis = {
        "a1": np.random.randn(D_PHI) * 0.1,
        "a2": np.random.randn(D_PHI) * 0.1,
    }
    scored = score_arms(arms, phis, A, b)
    _test("scored 2 arms", len(scored) == 2)
    _test("sorted descending", scored[0].score >= scored[1].score)
    # Underexposed arm should have higher UCB bonus
    under = [s for s in scored if s.impressions == 10][0]
    _test("underexposed has bonus in ucb", under.ucb_bonus > 0)

    # --- Test 3: update ---
    print("\n🔄 update")
    phi_test = np.random.randn(D_PHI) * 0.01
    A_new, b_new = update(phi_test, 1.0, A, b)
    _test("A updated shape", A_new.shape == (D_PHI, D_PHI))
    _test("b updated shape", b_new.shape == (D_PHI,))
    _test("A changed", not np.array_equal(A_new, A))

    # --- Test 4: compute_reward ---
    print("\n🎯 compute_reward")
    _test("click = 0.3", compute_reward("click") == 0.3)
    _test("reservation = 1.0", compute_reward("reservation") == 1.0)
    _test("unknown event = 0.0", compute_reward("unknown_event") == 0.0)

    # Session dedup
    sess = {}
    r1 = compute_reward("click", session_rewards=sess, listing_id="L1")
    _test("first click delta = 0.3", r1 == 0.3)
    r2 = compute_reward("click", session_rewards=sess, listing_id="L1")
    _test("second click delta = 0.0", r2 == 0.0)
    r3 = compute_reward("wishlist", session_rewards=sess, listing_id="L1")
    _test("wishlist upgrade delta = 0.55", abs(r3 - 0.55) < 0.01)

    # Dwell exit
    _test("dwell_exit 60s = 0.7", compute_reward("dwell_exit", dwell_seconds=60) == 0.7)
    _test("dwell_exit 30s = 0.5", compute_reward("dwell_exit", dwell_seconds=30) == 0.5)
    _test("dwell_exit 10s = 0.1", compute_reward("dwell_exit", dwell_seconds=10) == 0.1)

    # --- Test 5: is_matrix_healthy ---
    print("\n🏥 is_matrix_healthy")
    _test("identity is healthy", is_matrix_healthy(np.eye(D_PHI)))
    _test("zeros is unhealthy", not is_matrix_healthy(np.zeros((D_PHI, D_PHI))))

    # --- Test 6: partial_reset ---
    print("\n🔁 partial_reset")
    A_r, b_r = partial_reset(A_new, b_new, lambda_decay=0.7)
    _test("reset A shape", A_r.shape == (D_PHI, D_PHI))
    _test("reset A is healthy", is_matrix_healthy(A_r))

    # --- Summary ---
    total = passed + failed
    print(f"\n{'=' * 50}")
    print(f" Results: {passed}/{total} passed")
    print(f"{'=' * 50}\n")
    sys.exit(1 if failed > 0 else 0)
