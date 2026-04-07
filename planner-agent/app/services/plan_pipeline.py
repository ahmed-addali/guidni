"""Plan Pipeline — async tool-first planning with robust structured outputs.

Architecture:
1) _gather_context: deterministic Python tools and async retrieval
2) _build_prompt: inject strict constraints + parser format instructions
3) generate_plan: LLM execution + universal parser fallback + safe retries

The LLM never computes budgets, distances, or weather. It only schedules from
pre-filtered candidates.
"""

import asyncio
import json
import logging
from datetime import date, timedelta
from typing import Any

import httpx
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

from app.db import queries
from app.db.connection import async_session
from app.llm.provider import get_llm
from app.rag.query_engine import rag_query
from app.schemas.plan_request import (
    BUDGET_RANGES,
    FOOD_COSTS,
    INTEREST_TO_QUERY,
    TRANSPORT_COSTS,
    PlanRequest,
)

try:
    from langchain_core.exceptions import OutputParserException
except Exception:  # pragma: no cover
    class OutputParserException(Exception):
        pass

logger = logging.getLogger(__name__)


class ActivityItem(BaseModel):
    time: str
    title: str
    entity_id: str
    entity_type: str
    city: str = ""
    price: float = 0.0
    justification: str


class DayPlan(BaseModel):
    date: str
    theme: str
    activities: list[ActivityItem] = Field(default_factory=list)
    estimated_daily_cost: float = 0.0


class TravelPlan(BaseModel):
    title: str
    overview: str
    days: list[DayPlan] = Field(default_factory=list)
    total_estimated_cost: float = 0.0


class WeatherDay(BaseModel):
    date: str
    condition: str
    temp_max: float
    temp_min: float
    rain_probability: float
    wind_kmh: float
    indoor_only: bool
    water_sports_allowed: bool


class PlanningContext(BaseModel):
    city: str
    num_days: int
    budget_total: int
    budget_per_day: int
    budget_per_activity: int
    budget_per_night: int
    meal_budget: int
    weather: list[WeatherDay] = Field(default_factory=list)
    weather_constraints: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    activities: list[dict[str, Any]] = Field(default_factory=list)
    restaurants: list[dict[str, Any]] = Field(default_factory=list)
    stays: list[dict[str, Any]] = Field(default_factory=list)
    attractions: list[dict[str, Any]] = Field(default_factory=list)


def _extract_json_block(text: str) -> str:
    depth = 0
    start = None
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start is not None:
                    return text[start:i + 1]
    return ""


def _extract_llm_text(response: Any) -> str:
    content = getattr(response, "content", response)
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                parts.append(str(item.get("text", "")))
            else:
                parts.append(str(item))
        content = "\n".join(parts)
    text = str(content or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


async def _fetch_weather(city: str, num_days: int, start_date: str | None) -> list[WeatherDay]:
    try:
        start = date.fromisoformat(start_date) if start_date else (date.today() + timedelta(days=1))
    except ValueError:
        start = date.today() + timedelta(days=1)

    end = start + timedelta(days=num_days - 1)

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": 33.8076,
                    "longitude": 10.8451,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max",
                    "timezone": "Africa/Tunis",
                    "start_date": start.isoformat(),
                    "end_date": end.isoformat(),
                },
                timeout=10.0,
            )
            data = resp.json()

        if resp.status_code != 200 or "daily" not in data:
            raise ValueError(f"weather status={resp.status_code}")

        daily = data["daily"]
        out: list[WeatherDay] = []
        for i in range(min(num_days, len(daily["temperature_2m_max"]))):
            weather_code = int(daily["weather_code"][i])
            rain = float(daily["precipitation_probability_max"][i] or 0)
            wind = float(daily["wind_speed_10m_max"][i] or 0)
            tmax = float(daily["temperature_2m_max"][i])
            tmin = float(daily["temperature_2m_min"][i])

            condition = "Clear"
            if weather_code in (2, 3):
                condition = "Clouds"
            elif weather_code in (45, 48):
                condition = "Fog"
            elif weather_code in (51, 53, 55, 61, 63, 65, 80, 81, 82):
                condition = "Rain"
            elif weather_code in (95, 96, 99):
                condition = "Thunderstorm"

            indoor_only = condition in ("Rain", "Thunderstorm") or rain >= 55
            water_allowed = (condition == "Clear") and rain < 30 and wind < 18 and tmax >= 24

            out.append(
                WeatherDay(
                    date=(start + timedelta(days=i)).isoformat(),
                    condition=condition,
                    temp_max=tmax,
                    temp_min=tmin,
                    rain_probability=rain,
                    wind_kmh=wind,
                    indoor_only=indoor_only,
                    water_sports_allowed=water_allowed,
                )
            )
        return out
    except Exception as e:
        logger.warning("Weather fetch failed for %s: %s", city, e)
        fallback: list[WeatherDay] = []
        for i in range(num_days):
            fallback.append(
                WeatherDay(
                    date=(start + timedelta(days=i)).isoformat(),
                    condition="Clear",
                    temp_max=26,
                    temp_min=18,
                    rain_probability=10,
                    wind_kmh=12,
                    indoor_only=False,
                    water_sports_allowed=True,
                )
            )
        return fallback


async def _compute_budget(request: PlanRequest) -> dict[str, int]:
    budget_levels = BUDGET_RANGES.get(request.budget_level, BUDGET_RANGES["mid-range"])
    food = FOOD_COSTS.get(request.budget_level, FOOD_COSTS["mid-range"])

    daily_food = int(food["breakfast"] + food["lunch"] + food["dinner"])
    daily_transport = int(TRANSPORT_COSTS.get("taxi", 30))
    daily_estimate = int(budget_levels["per_activity"] * 2 + daily_food + daily_transport)

    if request.budget_total:
        total = int(request.budget_total)
    else:
        total = int(daily_estimate * request.num_days + budget_levels["per_night"] * max(request.num_days - 1, 1))

    return {
        "budget_total": total,
        "budget_per_day": max(1, total // max(1, request.num_days)),
        "budget_per_activity": int(budget_levels["per_activity"]),
        "budget_per_night": int(budget_levels["per_night"]),
        "meal_budget": int(food["lunch"]),
    }


async def _derive_tags(request: PlanRequest, weather: list[WeatherDay]) -> list[str]:
    tags: list[str] = []
    for interest in request.interests:
        mapped = INTEREST_TO_QUERY.get(interest, interest.replace("_", " "))
        tags.extend([tok.strip().lower().replace(" ", "_") for tok in mapped.split()[:2]])

    has_indoor_day = any(w.indoor_only for w in weather)
    if has_indoor_day:
        tags.extend(["indoor", "cultural", "museum"])

    if all(w.water_sports_allowed for w in weather):
        tags.extend(["beach", "water_sports"])
    else:
        tags.append("non_water")

    unique: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        if tag and tag not in seen:
            seen.add(tag)
            unique.append(tag)
    return unique[:12]


async def _fetch_user_profile(user_id: str) -> dict[str, Any]:
    try:
        async with async_session() as session:
            user = await queries.get_user(session, user_id)
            pref = await queries.get_user_preference(session, user_id)
        return {
            "name": user.get("name") if user else "Traveler",
            "language": pref.get("language") if pref else None,
        }
    except Exception as e:
        logger.warning("User profile lookup failed for %s: %s", user_id, e)
        return {"name": "Traveler", "language": None}


async def _gather_context(request: PlanRequest) -> PlanningContext:
    logger.info("Pipeline Step 1/3: Gathering Context for region '%s' (Days: %d, Traveler: '%s')", request.region, request.num_days, request.traveler_type)
    budget = await _compute_budget(request)
    logger.debug("Computed Budget: %s", budget)
    
    logger.debug("Fetching weather...")
    weather = await _fetch_weather(request.region, request.num_days, request.start_date)
    tags = await _derive_tags(request, weather)
    logger.info("Derived Tags: %s", tags)

    weather_constraints: list[str] = []
    for idx, day in enumerate(weather, start=1):
        if day.indoor_only:
            weather_constraints.append(f"Day {idx} is indoor-only due to weather ({day.condition}).")
        if not day.water_sports_allowed:
            weather_constraints.append(f"Day {idx} must avoid water sports (rain/wind/temperature).")

    logger.debug("Weather constraints: %s", weather_constraints)

    # Retrieval is strictly filtered by Qdrant (price/city/entity_type/tags).
    logger.info("Executing concurrent RAG queries for activities, restaurants, stays, and attractions...")
    activities_task = rag_query(
        query=" ".join(request.interests) or "travel activities",
        entity_types=["activity"],
        region=request.region,
        city=request.region,
        max_price=budget["budget_per_activity"],
        tags=tags,
        top_k=max(10, request.num_days * 4),
    )
    restaurants_task = rag_query(
        query=f"restaurants food dining {request.region}",
        entity_types=["restaurant"],
        city=request.region,
        max_price=budget["meal_budget"],
        tags=tags,
        top_k=max(8, request.num_days * 3),
    )
    stays_task = rag_query(
        query=f"{request.accommodation_type} accommodation {request.region}",
        entity_types=["stay"],
        region=request.region,
        city=request.region,
        max_price=budget["budget_per_night"],
        tags=tags,
        top_k=6,
    )
    attractions_task = rag_query(
        query=f"attractions sightseeing {request.region}",
        entity_types=["attraction"],
        region=request.region,
        city=request.region,
        tags=tags,
        top_k=max(6, request.num_days * 2),
    )
    profile_task = _fetch_user_profile(request.user_id)

    activities, restaurants, stays, attractions, profile = await asyncio.gather(
        activities_task,
        restaurants_task,
        stays_task,
        attractions_task,
        profile_task,
    )

    if not activities and not attractions:
        logger.warning("No activity/attraction candidates returned from RAG for region=%s", request.region)

    # Context injection note: deterministic calculations are done here, not by LLM.
    logger.info(
        "Context gathered: activities=%d restaurants=%d stays=%d attractions=%d tags=%s",
        len(activities), len(restaurants), len(stays), len(attractions), tags,
    )

    return PlanningContext(
        city=request.region,
        num_days=request.num_days,
        budget_total=budget["budget_total"],
        budget_per_day=budget["budget_per_day"],
        budget_per_activity=budget["budget_per_activity"],
        budget_per_night=budget["budget_per_night"],
        meal_budget=budget["meal_budget"],
        weather=weather,
        weather_constraints=weather_constraints,
        tags=tags,
        activities=activities,
        restaurants=restaurants,
        stays=stays,
        attractions=attractions,
    )


async def _compact_candidates(items: list[dict[str, Any]], max_items: int, label: str) -> str:
    if not items:
        return f"{label}: none"
    lines = []
    for item in items[:max_items]:
        lines.append(
            f"- id={item.get('entity_id','')}; title={item.get('title','')}; "
            f"city={item.get('city','')}; price={item.get('price',0)}; "
            f"tags={','.join(item.get('tags', []))}; enriched={item.get('is_enriched', False)}; "
            f"desc={(item.get('description') or item.get('snippet') or '')[:120]}"
        )
    return "\n".join(lines)


async def _build_prompt(
    request: PlanRequest,
    context: PlanningContext,
    parser: PydanticOutputParser,
) -> str:
    logger.info("Pipeline Step 2/3: Building prompt...")
    format_instructions = parser.get_format_instructions()

    activity_block = await _compact_candidates(context.activities, max(10, request.num_days * 4), "activities")
    restaurant_block = await _compact_candidates(context.restaurants, max(8, request.num_days * 3), "restaurants")
    stay_block = await _compact_candidates(context.stays, 4, "stays")
    attraction_block = await _compact_candidates(context.attractions, max(6, request.num_days * 2), "attractions")

    weather_lines = []
    for idx, day in enumerate(context.weather, start=1):
        weather_lines.append(
            f"Day {idx} ({day.date}): {day.condition}, temp {day.temp_min}-{day.temp_max}C, rain={day.rain_probability}%, "
            f"wind={day.wind_kmh}km/h, indoor_only={day.indoor_only}, water_sports_allowed={day.water_sports_allowed}"
        )

    constraint_lines = context.weather_constraints or ["No weather hard restrictions."]

    prompt = f"""
You are an expert travel scheduler.

DUMB CALCULATOR, SMART SCHEDULER RULE:
The provided activities already fit the user's budget and weather constraints.
Your ONLY job is to select the best ones, arrange them logically into a daily schedule,
and write creative, engaging justifications for why they were chosen.

USER:
- Region/City: {context.city}
- Traveler type: {request.traveler_type}
- Days: {request.num_days}
- Interests: {', '.join(request.interests) if request.interests else 'general'}
- Budget total: {context.budget_total} TND
- Budget/day: {context.budget_per_day} TND
- Budget/activity ceiling: {context.budget_per_activity} TND
- Meal budget ceiling: {context.meal_budget} TND
- Stay budget/night ceiling: {context.budget_per_night} TND
- Retrieval tags used: {', '.join(context.tags)}

PRECALCULATED WEATHER CONSTRAINTS (MUST RESPECT):
{chr(10).join(f'- {line}' for line in constraint_lines)}

WEATHER BY DAY:
{chr(10).join(weather_lines)}

STRICTLY FILTERED CANDIDATES FROM QDRANT:
ACTIVITIES:
{activity_block}

RESTAURANTS:
{restaurant_block}

STAYS:
{stay_block}

ATTRACTIONS:
{attraction_block}

RULES:
- Never invent entities. Use only ids/titles present in candidate lists.
- Ensure realistic daily flow and time ordering.
- Prefer candidates with enriched=true when quality is similar.
- Include concise but vivid justification for each selected activity item.
- Keep output strictly valid JSON following the schema instructions.

FORMAT INSTRUCTIONS (MANDATORY):
{format_instructions}
""".strip()

    return prompt


async def _safe_fallback_plan(request: PlanRequest, context: PlanningContext) -> dict[str, Any]:
    day_plans: list[DayPlan] = []
    base_date = context.weather[0].date if context.weather else date.today().isoformat()

    for i in range(request.num_days):
        items: list[ActivityItem] = []
        source = context.activities[i:i + 2]
        for j, a in enumerate(source):
            items.append(
                ActivityItem(
                    time="10:00" if j == 0 else "16:00",
                    title=str(a.get("title", "Curated Activity")),
                    entity_id=str(a.get("entity_id", "")),
                    entity_type=str(a.get("entity_type", "activity")),
                    city=str(a.get("city", context.city)),
                    price=float(a.get("price", 0) or 0),
                    justification="Selected from pre-filtered candidates as a reliable fit for your trip goals.",
                )
            )

        if not items:
            items.append(
                ActivityItem(
                    time="11:00",
                    title="Free exploration",
                    entity_id="",
                    entity_type="attraction",
                    city=context.city,
                    price=0,
                    justification="Fallback item while preserving a valid structured response.",
                )
            )

        day_plans.append(
            DayPlan(
                date=context.weather[i].date if i < len(context.weather) else base_date,
                theme="Curated Discovery",
                activities=items,
                estimated_daily_cost=sum(x.price for x in items),
            )
        )

    plan = TravelPlan(
        title=f"{request.num_days}-Day {context.city} Itinerary",
        overview="Generated with a safe fallback due to model formatting issues.",
        days=day_plans,
        total_estimated_cost=sum(d.estimated_daily_cost for d in day_plans),
    )
    return {"plan": plan.model_dump()}


async def generate_plan(
    request: PlanRequest,
    context: PlanningContext,
    provider: str | None = None,
    model: str | None = None,
) -> dict[str, Any]:
    logger.info("Pipeline Step 3/3: Generating Plan via LLM (Provider=%s, Model=%s)", provider, model)
    parser = PydanticOutputParser(pydantic_object=TravelPlan)
    prompt = await _build_prompt(request=request, context=context, parser=parser)

    # Universal approach: parser instructions are always injected.
    # Optional structured-output can be attempted first on stronger cloud models,
    # but parsing fallback remains the source of truth for cross-model reliability.
    llm = get_llm(temperature=0.25, json_mode=False, provider=provider, model=model)

    try_structured_first = bool(provider in {"groq", "gemini"}) if provider else False
    logger.debug("Prompt created (length=%d). Starting LLM invocations (max 3 attempts).", len(prompt))

    for attempt in range(1, 4):
        logger.info("LLM Generation Attempt %d/3...", attempt)
        try:
            current_llm = llm
            if try_structured_first and attempt == 1:
                try:
                    logger.debug("Attempting with_structured_output...")
                    current_llm = llm.with_structured_output(TravelPlan)
                except Exception as e:
                    logger.warning("with_structured_output unavailable: %s", e)
                    current_llm = llm

            logger.debug("Waiting for LLM response...")
            response = await current_llm.ainvoke([HumanMessage(content=prompt)])

            # If model already returned Pydantic instance via structured output.
            if isinstance(response, TravelPlan):
                logger.info("Successfully returned structured object from LLM.")
                return {"plan": response.model_dump()}

            logger.debug("Raw LLM response received, parsing...")
            text = _extract_llm_text(response)
            if not text:
                raise OutputParserException("Empty model output")

            try:
                parsed = parser.parse(text)
                logger.info("Successfully parsed LLM text into Pydantic model.")
                return {"plan": parsed.model_dump()}
            except OutputParserException:
                logger.debug("PydanticOutputParser failed, attempting fallback JSON block extraction...")
                raw_json = _extract_json_block(text)
                if raw_json:
                    data = json.loads(raw_json)
                    parsed = TravelPlan.model_validate(data)
                    logger.info("Successfully parsed plan using JSON extraction fallback.")
                    return {"plan": parsed.model_dump()}
                raise

        except OutputParserException as e:
            logger.warning("Plan parsing failed on attempt %d: %s", attempt, e)
            continue
        except Exception as e:
            logger.error("Plan generation failed on attempt %d: %s", attempt, e, exc_info=True)
            continue

    logger.error("All plan generation attempts failed, returning safe fallback")
    return await _safe_fallback_plan(request, context)


async def run_plan_pipeline(
    request: PlanRequest,
    provider: str | None = None,
    model: str | None = None,
) -> dict[str, Any]:
    logger.info("=== STARTING PLAN PIPELINE ===")
    context = await _gather_context(request)
    result = await generate_plan(request=request, context=context, provider=provider, model=model)
    logger.info("=== PLAN PIPELINE COMPLETE ===")
    return result
