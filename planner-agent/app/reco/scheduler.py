"""Scheduler — background job scheduler for LinUCB nightly tasks.

Jobs:
    1. profile_update  — 3:00 AM daily (rebuild user affinities)
    2. concept_drift   — 1st of month 4:00 AM (partial reset check)
    3. tag_refresh     — 15th of month 2:00 AM (re-extract stale tags)
    4. matrix_persist  — every 2 minutes (RAM → DB flush)

All times are Africa/Tunis timezone.
All jobs have max_instances=1 to prevent overlap.
"""

from __future__ import annotations

import logging
from typing import Optional

from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

_scheduler: Optional[BackgroundScheduler] = None


def _safe_profile_update() -> None:
    """Wrapper for profile update job with error handling."""
    try:
        from app.reco.nightly_job import run_profile_update_job
        result = run_profile_update_job()
        logger.info("Profile update job completed: %s", result)
    except Exception as e:
        logger.error("Profile update job failed: %s", e, exc_info=True)


def _safe_concept_drift() -> None:
    """Wrapper for concept drift check with error handling."""
    try:
        from app.reco.nightly_job import run_concept_drift_check
        applied = run_concept_drift_check()
        logger.info("Concept drift check completed: applied=%s", applied)
    except Exception as e:
        logger.error("Concept drift job failed: %s", e, exc_info=True)


def _safe_tag_refresh() -> None:
    """Wrapper for tag refresh with error handling."""
    try:
        from app.reco.nightly_job import run_tag_refresh
        result = run_tag_refresh()
        logger.info("Tag refresh job completed: %s", result)
    except Exception as e:
        logger.error("Tag refresh job failed: %s", e, exc_info=True)


def _safe_matrix_persist() -> None:
    """Wrapper for matrix persistence with error handling."""
    try:
        from app.reco.db import persist_matrices_to_db
        persist_matrices_to_db()
    except Exception as e:
        logger.error("Matrix persistence failed: %s", e, exc_info=True)


def start_scheduler() -> BackgroundScheduler:
    """Start the background scheduler with all jobs registered.

    Returns:
        The running BackgroundScheduler instance.
    """
    global _scheduler

    executors = {"default": ThreadPoolExecutor(max_workers=2)}
    _scheduler = BackgroundScheduler(
        executors=executors,
        timezone="Africa/Tunis",
    )

    # ── Nightly jobs ──

    _scheduler.add_job(
        _safe_profile_update,
        "cron",
        hour=3,
        minute=0,
        id="profile_update",
        name="User Profile Update",
        max_instances=1,
        misfire_grace_time=3600,  # If missed, run within 1 hour
    )

    _scheduler.add_job(
        _safe_concept_drift,
        "cron",
        day=1,
        hour=4,
        minute=0,
        id="concept_drift",
        name="Concept Drift Check",
        max_instances=1,
        misfire_grace_time=3600,
    )

    _scheduler.add_job(
        _safe_tag_refresh,
        "cron",
        day=15,
        hour=2,
        minute=0,
        id="tag_refresh",
        name="Tag Refresh",
        max_instances=1,
        misfire_grace_time=3600,
    )

    # ── Matrix persistence (every 2 minutes) ──

    _scheduler.add_job(
        _safe_matrix_persist,
        "interval",
        minutes=2,
        id="matrix_persist",
        name="Matrix RAM→DB Persist",
        max_instances=1,
    )

    _scheduler.start()
    logger.info(
        "Scheduler started: 4 jobs registered (Africa/Tunis timezone)\n"
        "  • profile_update  — daily 3:00 AM\n"
        "  • concept_drift   — 1st of month 4:00 AM\n"
        "  • tag_refresh     — 15th of month 2:00 AM\n"
        "  • matrix_persist  — every 2 minutes"
    )
    return _scheduler


def shutdown_scheduler() -> None:
    """Gracefully shut down the scheduler.

    Uses wait=False to avoid blocking the shutdown process.
    """
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
        _scheduler = None


# ──────────────────────────────────────────────────────────────
# Self-tests
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
    )

    print("\n" + "=" * 50)
    print(" scheduler.py — Smoke Test")
    print("=" * 50)

    passed = 0
    failed = 0

    def _test(name, cond):
        global passed, failed
        if cond:
            print(f"  ✅ {name}")
            passed += 1
        else:
            print(f"  ❌ {name}")
            failed += 1

    # Test 1: Scheduler starts
    sched = start_scheduler()
    _test("scheduler started", sched.running)

    # Test 2: All 4 jobs registered
    jobs = sched.get_jobs()
    job_ids = {j.id for j in jobs}
    _test("profile_update registered", "profile_update" in job_ids)
    _test("concept_drift registered", "concept_drift" in job_ids)
    _test("tag_refresh registered", "tag_refresh" in job_ids)
    _test("matrix_persist registered", "matrix_persist" in job_ids)

    # Test 3: Timezone
    _test("timezone is Africa/Tunis",
          str(sched.timezone) == "Africa/Tunis")

    # Test 4: Shutdown
    shutdown_scheduler()
    _test("scheduler stopped", _scheduler is None)

    total = passed + failed
    print(f"\n{'=' * 50}")
    print(f" Results: {passed}/{total} passed")
    print(f"{'=' * 50}\n")
    sys.exit(1 if failed > 0 else 0)
