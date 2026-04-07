"""Weather tools — get forecast and climate data using Open-Meteo API.

Uses Open-Meteo (free, no API key required) for forecasts up to 16 days.
Falls back to climate averages for dates >16 days out.
"""

import logging
from datetime import datetime
from langchain_core.tools import tool
import httpx

logger = logging.getLogger(__name__)

# Djerba climate averages by month (temp °C, rain probability %)
DJERBA_CLIMATE = {
    1:  {"avg_temp": 12, "max_temp": 16, "rain_prob": 35, "sunny_hours": 6},
    2:  {"avg_temp": 13, "max_temp": 17, "rain_prob": 30, "sunny_hours": 7},
    3:  {"avg_temp": 15, "max_temp": 20, "rain_prob": 25, "sunny_hours": 8},
    4:  {"avg_temp": 18, "max_temp": 23, "rain_prob": 15, "sunny_hours": 9},
    5:  {"avg_temp": 22, "max_temp": 27, "rain_prob": 10, "sunny_hours": 10},
    6:  {"avg_temp": 26, "max_temp": 31, "rain_prob": 5,  "sunny_hours": 12},
    7:  {"avg_temp": 29, "max_temp": 34, "rain_prob": 2,  "sunny_hours": 13},
    8:  {"avg_temp": 29, "max_temp": 34, "rain_prob": 5,  "sunny_hours": 12},
    9:  {"avg_temp": 26, "max_temp": 31, "rain_prob": 15, "sunny_hours": 10},
    10: {"avg_temp": 22, "max_temp": 27, "rain_prob": 25, "sunny_hours": 8},
    11: {"avg_temp": 17, "max_temp": 22, "rain_prob": 30, "sunny_hours": 7},
    12: {"avg_temp": 13, "max_temp": 17, "rain_prob": 35, "sunny_hours": 6},
}

# Djerba coordinates
DJERBA_COORDS = {"lat": 33.8076, "lon": 10.8451}

# WMO weather condition codes → human-readable
WMO_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

WMO_CONDITION_MAP = {
    0: "Clear", 1: "Clear", 2: "Clouds", 3: "Clouds",
    45: "Fog", 48: "Fog",
    51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
    61: "Rain", 63: "Rain", 65: "Rain",
    71: "Snow", 73: "Snow", 75: "Snow",
    80: "Rain", 81: "Rain", 82: "Rain",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
}


@tool
async def get_weather(region: str, date: str) -> dict:
    """Get weather forecast for a region and date. Includes recommendations for
    outdoor activities. For dates within 16 days, uses real Open-Meteo forecast.
    For dates further out, uses historical climate averages.

    Args:
        region: Region name (e.g. "Djerba")
        date: Date in ISO format (YYYY-MM-DD)
    """
    try:
        target_date = datetime.fromisoformat(date).date()
    except ValueError:
        return {"error": f"Invalid date format: {date}. Use YYYY-MM-DD"}

    today = datetime.now().date()
    days_ahead = (target_date - today).days

    # Open-Meteo supports up to 16-day forecasts (free tier)
    if 0 <= days_ahead <= 16:
        return await _get_open_meteo_forecast(region, target_date)

    # Climate averages for dates beyond 16 days
    return _get_climate_forecast(target_date)


async def _get_open_meteo_forecast(region: str, target_date) -> dict:
    """Fetch real forecast from Open-Meteo (free, no API key needed)."""
    target_str = target_date.isoformat()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": DJERBA_COORDS["lat"],
                    "longitude": DJERBA_COORDS["lon"],
                    "daily": ",".join([
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "apparent_temperature_max",
                        "precipitation_sum",
                        "precipitation_probability_max",
                        "wind_speed_10m_max",
                        "weather_code",
                        "sunshine_duration",
                        "uv_index_max",
                    ]),
                    "timezone": "Africa/Tunis",
                    "start_date": target_str,
                    "end_date": target_str,
                },
                timeout=10.0,
            )
            data = response.json()

        if response.status_code != 200 or "daily" not in data:
            logger.warning("Open-Meteo API error: %s", data)
            return _get_climate_forecast(target_date)

        daily = data["daily"]

        # Extract daily values (index 0 since we requested a single day)
        temp_max = daily["temperature_2m_max"][0]
        temp_min = daily["temperature_2m_min"][0]
        temp_avg = round((temp_max + temp_min) / 2, 1)
        wind_speed = daily["wind_speed_10m_max"][0]
        precip_sum = daily["precipitation_sum"][0]
        precip_prob = daily["precipitation_probability_max"][0]
        weather_code = daily["weather_code"][0]
        sunshine_secs = daily["sunshine_duration"][0]
        sunshine_hours = round(sunshine_secs / 3600, 1) if sunshine_secs else 0
        uv_index = daily["uv_index_max"][0]

        condition = WMO_CONDITION_MAP.get(weather_code, "Unknown")
        description = WMO_DESCRIPTIONS.get(weather_code, f"WMO code {weather_code}")

        is_good_for_outdoor = condition in ("Clear", "Clouds") and temp_avg > 15 and wind_speed < 30
        is_good_for_beach = condition == "Clear" and temp_max > 22 and wind_speed < 25

        recommendation = _get_weather_recommendation(condition, temp_max, wind_speed, precip_prob)

        result = {
            "date": target_str,
            "source": "open_meteo_forecast",
            "temperature_avg": temp_avg,
            "temperature_max": temp_max,
            "temperature_min": temp_min,
            "condition": condition,
            "description": description,
            "wind_speed_max_kmh": wind_speed,
            "precipitation_mm": precip_sum,
            "precipitation_probability": precip_prob,
            "sunshine_hours": sunshine_hours,
            "uv_index": uv_index,
            "is_good_for_outdoor": is_good_for_outdoor,
            "is_good_for_beach": is_good_for_beach,
            "recommendation": recommendation,
        }

        logger.info(
            "Weather for %s: %s, %d°C (%d-%d°C), wind %d km/h, rain %d%%, UV %.1f",
            target_str, description, temp_avg, temp_min, temp_max,
            wind_speed, precip_prob, uv_index,
        )
        return result

    except Exception as e:
        logger.warning("Open-Meteo API failed: %s", e)
        return _get_climate_forecast(target_date)


def _get_climate_forecast(target_date) -> dict:
    """Use climate averages for the target month."""
    month = target_date.month
    climate = DJERBA_CLIMATE.get(month, DJERBA_CLIMATE[6])

    is_good_for_outdoor = climate["rain_prob"] < 30 and climate["avg_temp"] > 15
    is_good_for_beach = climate["avg_temp"] > 22 and climate["rain_prob"] < 20

    return {
        "date": target_date.isoformat(),
        "source": "climate_average",
        "temperature_avg": climate["avg_temp"],
        "temperature_max": climate["max_temp"],
        "rain_probability": climate["rain_prob"],
        "sunny_hours": climate["sunny_hours"],
        "is_good_for_outdoor": is_good_for_outdoor,
        "is_good_for_beach": is_good_for_beach,
        "recommendation": _get_climate_recommendation(climate),
    }


def _get_weather_recommendation(condition: str, temp: float, wind: float, rain_prob: float) -> str:
    """Generate weather-based activity recommendation."""
    if condition in ("Rain", "Drizzle", "Thunderstorm"):
        return "Rainy weather — indoor or cultural activities recommended. Visit museums, souks, or enjoy a traditional hammam."
    if rain_prob > 60:
        return "High chance of rain — have indoor backup plans ready. Consider cultural sites and covered markets."
    if condition == "Clear" and temp > 30:
        return "Hot and sunny — beach activities and water sports are ideal. Avoid strenuous outdoor activities during 12-3 PM."
    if condition == "Clear" and temp > 22:
        return "Perfect weather for outdoor activities — beaches, walking tours, and water sports all great options!"
    if condition == "Clouds":
        return "Cloudy but pleasant — good for sightseeing and walking tours without the intense sun."
    if wind > 30:
        return "Windy conditions — beach activities may be less comfortable. Consider inland activities."
    return "Good conditions for exploring Djerba's attractions."


def _get_climate_recommendation(climate: dict) -> str:
    """Generate climate-based recommendation."""
    temp = climate["avg_temp"]
    rain = climate["rain_prob"]

    if temp > 28:
        return "Hot season — early morning and evening activities recommended. Beach and water sports ideal."
    if temp > 22:
        return "Warm and pleasant — perfect conditions for all outdoor activities."
    if temp > 15:
        return "Mild weather — great for sightseeing and cultural activities. Bring a light jacket for evenings."
    if rain > 30:
        return "Cool season with some rain risk — mix indoor and outdoor activities. Great for cultural exploration."
    return "Mild conditions — comfortable for all types of activities."
