"""Plan guardrail tools used by the async planning pipeline.

This module contains three high-impact checks:
1) validate_plan_feasibility: validates overlaps, budget pressure, and weather mismatches
2) check_entity_open_now: verifies opening windows for restaurant/attraction/activity
3) batch_check_availability: checks activity capacity in batch for a date
"""

from __future__ import annotations

import logging
import re
from datetime import date, datetime, time
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import queries
from app.db.connection import async_session
from app.db.models import Activity, Attraction, Restaurant ,StayBlockedDate, RentalBlockedDate, TransferBlockedDate

logger = logging.getLogger(__name__)


_DEFAULT_DURATION_MINUTES = {
    "activity": 120,
    "restaurant": 90,
    "attraction": 75,
    "stay": 0,
}

_OUTDOOR_HINTS = {
    "beach", "sea", "boat", "snorkel", "diving", "safari", "hiking", "hike",
    "quad", "horse", "camel", "tour", "outdoor", "watersport", "water sport",
}

_WATER_HINTS = {
    "water", "sea", "snorkel", "diving", "jet ski", "boat", "kayak", "paddle", "catamaran",
}

_INDOOR_HINTS = {
    "museum", "indoor", "gallery", "hammam", "spa", "cinema", "mall", "covered",
}

_WEEKDAY_ALIASES = {
    "mon": {"mon", "monday", "lun", "lundi"},
    "tue": {"tue", "tues", "tuesday", "mar", "mardi"},
    "wed": {"wed", "wednesday", "mer", "mercredi"},
    "thu": {"thu", "thurs", "thursday", "jeu", "jeudi"},
    "fri": {"fri", "friday", "ven", "vendredi"},
    "sat": {"sat", "saturday", "sam", "samedi"},
    "sun": {"sun", "sunday", "dim", "dimanche"},
}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_entity_type(entity_type: Any) -> str:
    txt = str(entity_type or "").strip().lower()
    if txt == "yummy":
        return "restaurant"
    return txt


def _parse_iso_datetime(value: str) -> datetime | None:
    txt = str(value or "").strip()
    if not txt:
        return None
    if txt.endswith("Z"):
        txt = txt[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(txt)
    except ValueError:
        try:
            return datetime.combine(date.fromisoformat(txt), time(hour=12, minute=0))
        except ValueError:
            return None


def _parse_time_value(value: Any) -> time | None:
    txt = str(value or "").strip().lower()
    if not txt:
        return None

    txt = txt.replace(".", ":")
    txt = txt.replace("h", ":")

    match = re.search(r"(?<!\d)(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?", txt)
    if not match:
        return None

    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    ampm = (match.group(3) or "").lower()

    if minute > 59:
        return None

    if ampm == "pm" and hour < 12:
        hour += 12
    elif ampm == "am" and hour == 12:
        hour = 0

    if hour < 0 or hour > 23:
        return None

    return time(hour=hour, minute=minute)


def _time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def _duration_from_text(raw: Any) -> int | None:
    txt = str(raw or "").strip().lower()
    if not txt:
        return None

    total = 0
    found = False

    for hours_str in re.findall(r"(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b", txt):
        found = True
        total += int(float(hours_str) * 60)

    for mins_str in re.findall(r"(\d+)\s*(?:m|min|mins|minute|minutes)\b", txt):
        found = True
        total += int(mins_str)

    if found:
        return max(15, total)

    plain_num = re.fullmatch(r"\s*(\d+)\s*", txt)
    if plain_num:
        val = int(plain_num.group(1))
        if val <= 12:
            return val * 60
        return val

    return None


def _estimate_duration_minutes(item: dict[str, Any], catalog_item: dict[str, Any], entity_type: str) -> int:
    for key in ("duration_minutes", "durationMinutes", "duration"):
        if key in item and item.get(key) not in (None, ""):
            if isinstance(item[key], (int, float)):
                return max(15, int(item[key]))
            parsed = _duration_from_text(item[key])
            if parsed is not None:
                return parsed

    for key in ("durationMinutes", "duration_minutes", "duration"):
        if key in catalog_item and catalog_item.get(key) not in (None, ""):
            if isinstance(catalog_item[key], (int, float)):
                return max(15, int(catalog_item[key]))
            parsed = _duration_from_text(catalog_item[key])
            if parsed is not None:
                return parsed

    return _DEFAULT_DURATION_MINUTES.get(entity_type, 90)


def _combined_item_text(item: dict[str, Any], catalog_item: dict[str, Any]) -> str:
    fields = [
        item.get("title"),
        item.get("entity_type"),
        item.get("justification"),
        catalog_item.get("title"),
        catalog_item.get("category"),
        catalog_item.get("description"),
        catalog_item.get("narrative_text"),
    ]

    tags = catalog_item.get("tags")
    if isinstance(tags, list):
        fields.extend(tags)
    elif tags:
        fields.append(tags)

    return " ".join(str(v).lower() for v in fields if v)


def _looks_outdoor(item: dict[str, Any], catalog_item: dict[str, Any]) -> bool:
    txt = _combined_item_text(item, catalog_item)

    indoor_outdoor = str(catalog_item.get("indoor_outdoor", "")).lower()
    if indoor_outdoor == "indoor":
        return False
    if indoor_outdoor == "outdoor":
        return True

    if any(hint in txt for hint in _INDOOR_HINTS):
        return False
    return any(hint in txt for hint in _OUTDOOR_HINTS)


def _looks_water_activity(item: dict[str, Any], catalog_item: dict[str, Any]) -> bool:
    txt = _combined_item_text(item, catalog_item)
    return any(hint in txt for hint in _WATER_HINTS)


def _normalize_weekday_token(value: Any) -> str:
    raw = re.sub(r"[^a-z]", "", str(value or "").strip().lower())
    if not raw:
        return ""
    for canonical, aliases in _WEEKDAY_ALIASES.items():
        if raw in aliases:
            return canonical
    if len(raw) >= 3:
        prefix = raw[:3]
        if prefix in _WEEKDAY_ALIASES:
            return prefix
    return raw


def _same_weekday(candidate: Any, check_dt: datetime) -> bool:
    target = _normalize_weekday_token(check_dt.strftime("%a"))
    return _normalize_weekday_token(candidate) == target


def _is_time_in_window(check_minutes: int, open_minutes: int, close_minutes: int) -> bool:
    if close_minutes >= open_minutes:
        return open_minutes <= check_minutes <= close_minutes

    # Overnight window, e.g. 20:00 -> 02:00
    return check_minutes >= open_minutes or check_minutes <= close_minutes


def _extract_time_ranges(raw_text: str) -> list[tuple[str, str]]:
    ranges: list[tuple[str, str]] = []
    if not raw_text:
        return ranges

    pattern = re.compile(
        r"(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|to|a|à)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)",
        re.IGNORECASE,
    )

    for match in pattern.finditer(raw_text):
        ranges.append((match.group(1), match.group(2)))

    return ranges


def validate_plan_feasibility(
    plan: dict[str, Any],
    *,
    budget_per_day: int,
    weather: list[dict[str, Any]] | None = None,
    activity_catalog: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Validate plan realism with deterministic checks.

    Checks covered:
    - Time overlap by day
    - Daily budget pressure vs budget_per_day
    - Basic weather incompatibilities (indoor-only and no-water days)
    """
    activity_catalog = activity_catalog or {}
    weather_map: dict[str, dict[str, Any]] = {}
    for w in weather or []:
        date_key = str(w.get("date", "")).strip()
        if date_key:
            weather_map[date_key] = w

    errors: list[str] = []
    warnings: list[str] = []

    days = plan.get("days") if isinstance(plan, dict) else None
    if not isinstance(days, list) or not days:
        return {
            "is_feasible": False,
            "severity": "high_risk",
            "errors": ["Plan has no day entries to validate."],
            "warnings": [],
            "stats": {
                "days_checked": 0,
                "items_checked": 0,
                "overlap_issues": 0,
                "budget_issues": 0,
                "weather_issues": 0,
            },
        }

    items_checked = 0
    overlap_issues = 0
    budget_issues = 0
    weather_issues = 0

    for idx, day in enumerate(days, start=1):
        if not isinstance(day, dict):
            warnings.append(f"Day {idx}: invalid day object format.")
            continue

        day_date = str(day.get("date", "")).strip()
        day_label = day_date or f"Day {idx}"

        activities = day.get("activities", [])
        if not isinstance(activities, list):
            warnings.append(f"{day_label}: activities is not a list.")
            continue

        estimated_daily_cost = _to_float(day.get("estimated_daily_cost"), default=-1)
        if estimated_daily_cost < 0:
            estimated_daily_cost = sum(_to_float(a.get("price"), default=0.0) for a in activities if isinstance(a, dict))

        if budget_per_day > 0 and estimated_daily_cost > budget_per_day * 1.15:
            budget_issues += 1
            warnings.append(
                f"{day_label}: estimated daily cost {estimated_daily_cost:.1f} TND exceeds budget/day {budget_per_day} TND."
            )

        slots: list[tuple[int, int, str]] = []
        for activity in activities:
            if not isinstance(activity, dict):
                continue

            items_checked += 1
            entity_id = str(activity.get("entity_id", "")).strip()
            entity_type = _normalize_entity_type(activity.get("entity_type"))
            title = str(activity.get("title", "Untitled activity"))
            catalog_item = activity_catalog.get(entity_id, {})

            start_time = _parse_time_value(activity.get("time"))
            if start_time is None:
                warnings.append(f"{day_label}: could not parse time for '{title}'.")
                continue

            start_minutes = _time_to_minutes(start_time)
            duration_minutes = _estimate_duration_minutes(activity, catalog_item, entity_type)
            end_minutes = start_minutes + duration_minutes
            slots.append((start_minutes, end_minutes, title))

            weather_info = weather_map.get(day_date)
            if weather_info:
                if bool(weather_info.get("indoor_only", False)) and entity_type in {"activity", "attraction"}:
                    if _looks_outdoor(activity, catalog_item):
                        weather_issues += 1
                        warnings.append(
                            f"{day_label}: '{title}' appears outdoor on an indoor-only weather day."
                        )

                if not bool(weather_info.get("water_sports_allowed", True)):
                    if _looks_water_activity(activity, catalog_item):
                        weather_issues += 1
                        warnings.append(
                            f"{day_label}: '{title}' appears water-based on a no-water day."
                        )

        slots.sort(key=lambda x: x[0])
        for i in range(1, len(slots)):
            _, prev_end, prev_title = slots[i - 1]
            curr_start, _, curr_title = slots[i]
            if curr_start < prev_end:
                overlap_issues += 1
                errors.append(
                    f"{day_label}: overlap detected between '{prev_title}' and '{curr_title}'."
                )

    if errors:
        severity = "high_risk"
    elif warnings:
        severity = "warning"
    else:
        severity = "ok"

    return {
        "is_feasible": len(errors) == 0,
        "severity": severity,
        "errors": errors,
        "warnings": warnings,
        "stats": {
            "days_checked": len(days),
            "items_checked": items_checked,
            "overlap_issues": overlap_issues,
            "budget_issues": budget_issues,
            "weather_issues": weather_issues,
        },
    }


async def _check_restaurant_open(restaurant_id: str, check_dt: datetime) -> dict[str, Any]:
    async with async_session() as session:
        result = await session.execute(
            select(Restaurant)
            .options(selectinload(Restaurant.hours))
            .where(Restaurant.id == restaurant_id)
        )
        restaurant = result.scalar_one_or_none()

    if not restaurant:
        return {
            "entity_type": "restaurant",
            "entity_id": restaurant_id,
            "status": "not_found",
            "is_open": None,
            "reason": "Restaurant not found.",
        }

    hours = list(restaurant.hours or [])
    if not hours:
        return {
            "entity_type": "restaurant",
            "entity_id": restaurant_id,
            "status": "unknown",
            "is_open": None,
            "reason": "No opening hours data available.",
        }

    day_rows = [h for h in hours if _same_weekday(getattr(h, "day", ""), check_dt)]
    if not day_rows:
        return {
            "entity_type": "restaurant",
            "entity_id": restaurant_id,
            "status": "unknown",
            "is_open": None,
            "reason": "No matching weekday entry in opening hours.",
        }

    check_minutes = _time_to_minutes(check_dt.time())
    parse_failures = 0

    for row in day_rows:
        if bool(getattr(row, "isClosed", False)):
            continue
        if bool(getattr(row, "isFullDayOpening", False)):
            return {
                "entity_type": "restaurant",
                "entity_id": restaurant_id,
                "status": "open",
                "is_open": True,
                "reason": "Marked as full-day opening.",
            }

        open_t = _parse_time_value(getattr(row, "opening", None))
        close_t = _parse_time_value(getattr(row, "closing", None))
        if open_t is None or close_t is None:
            parse_failures += 1
            continue

        if _is_time_in_window(check_minutes, _time_to_minutes(open_t), _time_to_minutes(close_t)):
            return {
                "entity_type": "restaurant",
                "entity_id": restaurant_id,
                "status": "open",
                "is_open": True,
                "reason": f"Within opening window {row.opening}-{row.closing}.",
            }

    all_closed = all(bool(getattr(row, "isClosed", False)) for row in day_rows)
    if all_closed:
        return {
            "entity_type": "restaurant",
            "entity_id": restaurant_id,
            "status": "closed",
            "is_open": False,
            "reason": "Marked closed for the requested day.",
        }

    if parse_failures == len(day_rows):
        return {
            "entity_type": "restaurant",
            "entity_id": restaurant_id,
            "status": "unknown",
            "is_open": None,
            "reason": "Could not parse opening/closing time values.",
        }

    return {
        "entity_type": "restaurant",
        "entity_id": restaurant_id,
        "status": "closed",
        "is_open": False,
        "reason": "Requested time is outside opening windows.",
    }


async def _check_attraction_open(attraction_id: str, check_dt: datetime) -> dict[str, Any]:
    async with async_session() as session:
        result = await session.execute(select(Attraction).where(Attraction.id == attraction_id))
        attraction = result.scalar_one_or_none()

    if not attraction:
        return {
            "entity_type": "attraction",
            "entity_id": attraction_id,
            "status": "not_found",
            "is_open": None,
            "reason": "Attraction not found.",
        }

    hours_text = str(getattr(attraction, "hours", "") or "").strip()
    if not hours_text:
        return {
            "entity_type": "attraction",
            "entity_id": attraction_id,
            "status": "unknown",
            "is_open": None,
            "reason": "No hours text available for this attraction.",
        }

    lower_hours = hours_text.lower()
    if any(token in lower_hours for token in ("24/7", "24h", "24 h", "always open", "open 24")):
        return {
            "entity_type": "attraction",
            "entity_id": attraction_id,
            "status": "open",
            "is_open": True,
            "reason": "Attraction appears to be open all day.",
        }

    if "closed" in lower_hours and not _extract_time_ranges(lower_hours):
        return {
            "entity_type": "attraction",
            "entity_id": attraction_id,
            "status": "closed",
            "is_open": False,
            "reason": "Hours text indicates closed.",
        }

    check_minutes = _time_to_minutes(check_dt.time())
    ranges = _extract_time_ranges(hours_text)

    if not ranges:
        return {
            "entity_type": "attraction",
            "entity_id": attraction_id,
            "status": "unknown",
            "is_open": None,
            "reason": "Could not extract explicit time range from hours text.",
        }

    for start_raw, end_raw in ranges:
        start_t = _parse_time_value(start_raw)
        end_t = _parse_time_value(end_raw)
        if start_t is None or end_t is None:
            continue
        if _is_time_in_window(check_minutes, _time_to_minutes(start_t), _time_to_minutes(end_t)):
            return {
                "entity_type": "attraction",
                "entity_id": attraction_id,
                "status": "open",
                "is_open": True,
                "reason": f"Within opening window {start_raw}-{end_raw}.",
            }

    return {
        "entity_type": "attraction",
        "entity_id": attraction_id,
        "status": "closed",
        "is_open": False,
        "reason": "Requested time is outside parsed opening ranges.",
    }


async def _check_activity_open(activity_id: str, check_dt: datetime) -> dict[str, Any]:
    async with async_session() as session:
        result = await session.execute(select(Activity).where(Activity.id == activity_id))
        activity = result.scalar_one_or_none()

    if not activity:
        return {
            "entity_type": "activity",
            "entity_id": activity_id,
            "status": "not_found",
            "is_open": None,
            "reason": "Activity not found.",
        }

    raw_times = str(getattr(activity, "availableTimes", "") or "")
    time_tokens = re.findall(r"\d{1,2}(?::\d{2})?\s*(?:am|pm)?", raw_times, flags=re.IGNORECASE)

    if not time_tokens:
        return {
            "entity_type": "activity",
            "entity_id": activity_id,
            "status": "unknown",
            "is_open": None,
            "reason": "No parseable available times for this activity.",
        }

    check_minutes = _time_to_minutes(check_dt.time())
    available_minutes: list[int] = []
    for token in time_tokens:
        token_time = _parse_time_value(token)
        if token_time is not None:
            available_minutes.append(_time_to_minutes(token_time))

    if not available_minutes:
        return {
            "entity_type": "activity",
            "entity_id": activity_id,
            "status": "unknown",
            "is_open": None,
            "reason": "Could not parse activity available times.",
        }

    if any(abs(check_minutes - candidate) <= 60 for candidate in available_minutes):
        return {
            "entity_type": "activity",
            "entity_id": activity_id,
            "status": "open",
            "is_open": True,
            "reason": "Requested time aligns with available start times.",
        }

    return {
        "entity_type": "activity",
        "entity_id": activity_id,
        "status": "closed",
        "is_open": False,
        "reason": "Requested time does not align with available start times.",
    }


async def check_entity_open_now(
    entity_type: str,
    entity_id: str,
    check_datetime_iso: str,
) -> dict[str, Any]:
    """Check if an entity is open at a specific datetime.

    Supports: restaurant, attraction, activity.
    """
    normalized_type = _normalize_entity_type(entity_type)
    normalized_id = str(entity_id or "").strip()

    check_dt = _parse_iso_datetime(check_datetime_iso)
    if check_dt is None:
        return {
            "entity_type": normalized_type,
            "entity_id": normalized_id,
            "status": "error",
            "is_open": None,
            "reason": f"Invalid datetime format: {check_datetime_iso}",
        }

    try:
        if normalized_type == "restaurant":
            result = await _check_restaurant_open(normalized_id, check_dt)
        elif normalized_type == "attraction":
            result = await _check_attraction_open(normalized_id, check_dt)
        elif normalized_type == "activity":
            result = await _check_activity_open(normalized_id, check_dt)
        else:
            result = {
                "entity_type": normalized_type,
                "entity_id": normalized_id,
                "status": "unsupported",
                "is_open": None,
                "reason": "Unsupported entity_type (use restaurant, attraction, or activity).",
            }

        result["check_datetime"] = check_dt.isoformat()
        return result
    except Exception as exc:
        logger.error("check_entity_open_now failed for %s/%s: %s", normalized_type, normalized_id, exc, exc_info=True)
        return {
            "entity_type": normalized_type,
            "entity_id": normalized_id,
            "status": "error",
            "is_open": None,
            "reason": f"Open-check failed: {str(exc)}",
            "check_datetime": check_dt.isoformat(),
        }


async def batch_check_availability(activity_ids: list[str], check_date: str) -> dict[str, Any]:
    """Check availability for many activities on one date.

    Reuses the existing deterministic query helper and returns one aggregated payload.
    """
    try:
        target_date = date.fromisoformat(str(check_date))
    except ValueError:
        return {
            "check_date": check_date,
            "error": "Invalid date format. Use YYYY-MM-DD.",
            "total": 0,
            "available_count": 0,
            "unavailable_count": 0,
            "results": [],
        }

    unique_ids: list[str] = []
    seen: set[str] = set()
    for raw_id in activity_ids or []:
        normalized = str(raw_id or "").strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_ids.append(normalized)

    if not unique_ids:
        return {
            "check_date": check_date,
            "total": 0,
            "available_count": 0,
            "unavailable_count": 0,
            "results": [],
        }

    results: list[dict[str, Any]] = []
    async with async_session() as session:
        for activity_id in unique_ids:
            availability = await queries.check_activity_availability(session, activity_id, target_date)
            item_result = {
                "activity_id": activity_id,
                "available": bool(availability.get("available", False)),
                "spots_left": availability.get("spots_left"),
                "total_capacity": availability.get("total_capacity"),
                "booked": availability.get("booked"),
            }
            if "error" in availability:
                item_result["error"] = availability["error"]
            results.append(item_result)

    available_count = sum(1 for row in results if row.get("available"))
    unavailable_count = len(results) - available_count

    return {
        "check_date": target_date.isoformat(),
        "total": len(results),
        "available_count": available_count,
        "unavailable_count": unavailable_count,
        "results": results,
    }

async def check_entity_blocked_dates(
    entity_type: str,
    entity_id: str,
    check_date_iso: str,
) -> dict[str, Any]:
    """Check if a stay, rental, or transfer is blocked on a specific date."""
    normalized_type = _normalize_entity_type(entity_type)
    normalized_id = str(entity_id or "").strip()

    try:
        # We only need the date part for blocked dates
        check_date = date.fromisoformat(str(check_date_iso).split("T")[0])
    except ValueError:
        return {
            "entity_type": normalized_type,
            "entity_id": normalized_id,
            "status": "error",
            "is_available": None,
            "reason": f"Invalid date format: {check_date_iso}. Use YYYY-MM-DD.",
        }

    try:
        async with async_session() as session:
            if normalized_type == "stay":
                stmt = select(StayBlockedDate).where(
                    StayBlockedDate.stayId == normalized_id,
                    StayBlockedDate.date == check_date
                )
            elif normalized_type == "rental":
                stmt = select(RentalBlockedDate).where(
                    RentalBlockedDate.rentalId == normalized_id,
                    RentalBlockedDate.date == check_date
                )
            elif normalized_type == "transfer":
                stmt = select(TransferBlockedDate).where(
                    TransferBlockedDate.transferId == normalized_id,
                    TransferBlockedDate.date == check_date
                )
            else:
                return {
                    "entity_type": normalized_type,
                    "entity_id": normalized_id,
                    "status": "unsupported",
                    "is_available": None,
                    "reason": "Unsupported entity_type for blocked dates (use stay, rental, or transfer).",
                }

            result = await session.execute(stmt)
            blocked_record = result.scalar_one_or_none()

        if blocked_record:
            return {
                "entity_type": normalized_type,
                "entity_id": normalized_id,
                "status": "blocked",
                "is_available": False,
                "check_date": check_date.isoformat(),
                "reason": getattr(blocked_record, "reason", "Blocked by host/admin") or "Blocked for this date.",
            }
        
        return {
            "entity_type": normalized_type,
            "entity_id": normalized_id,
            "status": "available",
            "is_available": True,
            "check_date": check_date.isoformat(),
            "reason": "No blocked dates found.",
        }

    except Exception as exc:
        logger.error("check_entity_blocked_dates failed for %s/%s: %s", normalized_type, normalized_id, exc, exc_info=True)
        return {
            "entity_type": normalized_type,
            "entity_id": normalized_id,
            "status": "error",
            "is_available": None,
            "reason": f"Availability check failed: {str(exc)}",
            "check_date": check_date.isoformat(),
        }