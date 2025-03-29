import json
import os
import datetime
import asyncio
from typing import Any, AsyncGenerator, Dict, List, Tuple

import httpx
from collections import defaultdict

from app.config.loggers import chat_logger as logger
from app.utils.search_utils import extract_urls_from_text
from app.utils.text_utils import classify_event_type
from app.config.settings import settings
from app.db.db_redis import get_cache, set_cache, ONE_HOUR_TTL


async def classify_intent(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Classify the intent of the user's message and set the intent in the context.
    This determines how the message will be processed in the pipeline.

    Supported intents:
    - "calendar": Add events to calendar
    - "generate_image": Create an image from a text description
    - None: Regular chat message (default)

    Args:
        context (Dict[str, Any]): The pipeline context

    Returns:
        Dict[str, Any]: Updated context with intent classification
    """
    result = await classify_event_type(context["query_text"])

    if result.get("highest_label") and result.get("highest_score", 0) >= 0.5:
        if result["highest_label"] in ["add to calendar"]:
            context["intent"] = "calendar"
        elif result["highest_label"] in ["generate image"]:
            context["intent"] = "generate_image"
        elif result["highest_label"] in ["weather"]:
            context["intent"] = "weather"

    return context


async def choose_llm_model(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Choose an LLM model based on whether notes or documents were added.
    """
    if context.get("notes_added") or context.get("docs_added"):
        context["llm_model"] = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    return context


async def process_message_urls(context: Dict[str, Any]) -> Dict[str, Any]:
    """Process message content for URLs and other enrichments.

    Args:
        content (str): The message content to process

    Returns:
        Dict[str, Any]: Dictionary containing processed content and metadata
    """
    urls = extract_urls_from_text(context["query_text"])

    context["pageFetchURLs"] = urls

    return context


http_async_client = httpx.AsyncClient()


async def fetch_weather_data(lat: float, lon: float, api_key: str) -> Tuple[Dict, Dict]:
    """
    Fetch weather and forecast data in parallel using asyncio.

    Args:
        lat (float): Latitude coordinate
        lon (float): Longitude coordinate
        api_key (str): OpenWeatherMap API key

    Returns:
        Tuple[Dict, Dict]: A tuple containing (current_weather, forecast_data)
    """
    # Create URLs for both API endpoints
    weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"

    # Fetch both endpoints in parallel
    weather_task = http_async_client.get(weather_url)
    forecast_task = http_async_client.get(forecast_url)

    # Wait for both requests to complete
    weather_response, forecast_response = await asyncio.gather(
        weather_task, forecast_task
    )

    # Process the responses
    weather_response.raise_for_status()
    forecast_response.raise_for_status()

    return weather_response.json(), forecast_response.json()


async def get_location_data(
    ip_address: str = None, location_name: str = None
) -> Dict[str, Any]:
    """
    Get location data either from a location name (via geocoding) or an IP address.

    Args:
        ip_address (str, optional): The user's IP address
        location_name (str, optional): Name of a specific location

    Returns:
        Dict[str, Any]: Location data including coordinates and metadata
    """
    cache_key = None
    if location_name:
        # Create a cache key for this location
        cache_key = f"weather:location:{location_name.lower().replace(' ', '_')}"

        location_data = await geocode_location(location_name)
        lat = location_data["lat"]
        lon = location_data["lon"]

        # Location details for the response
        city = location_data.get("city")
        country = location_data.get("country")
        region = location_data.get("region")

        # If city is None but we have a display name, try to extract city from it
        if not city and location_data.get("display_name"):
            parts = location_data["display_name"].split(", ")
            city = parts[0] if parts else location_name
    else:
        # Create a cache key for the IP address
        cache_key = f"weather:ip:{ip_address}"

        # Use IP-based geolocation
        geo_response = await http_async_client.get(
            f"http://ip-api.com/json/{ip_address}"
        )
        geo_response.raise_for_status()
        geolocation = geo_response.json()

        if geolocation.get("status") != "success":
            raise Exception("Failed to get location from IP address")

        lat = geolocation.get("lat")
        lon = geolocation.get("lon")
        city = geolocation.get("city")
        country = geolocation.get("country")
        region = geolocation.get("regionName")

    return {
        "lat": lat,
        "lon": lon,
        "city": city,
        "country": country,
        "region": region,
        "cache_key": cache_key,
    }


async def prepare_weather_data(
    lat: float, lon: float, location_info: Dict[str, Any], api_key: str
) -> Dict[str, Any]:
    """
    Fetch and prepare weather data for a location.

    Args:
        lat (float): Latitude coordinate
        lon (float): Longitude coordinate
        location_info (Dict[str, Any]): Location information including city, country and region
        api_key (str): OpenWeatherMap API key

    Returns:
        Dict[str, Any]: Formatted weather data
    """
    # Extract location details
    city = location_info.get("city")
    country = location_info.get("country")
    region = location_info.get("region")

    # Fetch current weather and forecast data in parallel
    current_weather, forecast_data = await fetch_weather_data(lat, lon, api_key)

    # Process forecast data to create a daily summary
    daily_forecasts = process_forecast_data(forecast_data)

    # Ensure required fields exist in 'sys' object to avoid validation errors
    if "sys" in current_weather:
        # Make sure the country field is present in the sys object
        if "country" not in current_weather["sys"]:
            # If we have country information from geolocation, use it
            if country:
                current_weather["sys"]["country"] = country
            else:
                # Otherwise set it to an empty string to meet model requirements
                current_weather["sys"]["country"] = ""
    else:
        # Create a minimal sys object if it doesn't exist
        current_weather["sys"] = {
            "country": country if country else "",
            "sunrise": int(datetime.datetime.now().timestamp()),
            "sunset": int(datetime.datetime.now().timestamp() + 43200),  # +12 hours
        }

    # Create combined weather object with current weather and forecast
    weather = {
        **current_weather,  # Include all current weather data
        "forecast": daily_forecasts,  # Add the forecast data
        "location": {
            "city": city,
            "country": country,
            "region": region,
        },
    }

    # Make sure the 'name' field (city name) is set
    if not weather.get("name") and city:
        weather["name"] = city

    return weather


async def user_weather(
    ip_address: str, location_name: str = None
) -> AsyncGenerator[str, None]:
    """
    Fetch weather data either based on user's IP address or for a specified location.

    This function has been modularized to separate concerns:
    1. Get location data (either from IP or location name)
    2. Check the cache for existing weather data
    3. Fetch and format weather data if needed
    4. Return the formatted response

    Args:
        ip_address (str): The user's IP address (used if location_name is None)
        location_name (str, optional): Name of a specific location to get weather for

    Yields:
        str: JSON-formatted weather data as server-sent events
    """
    try:
        yield f"data: {json.dumps({'status': 'weather'})}\n\n"

        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            raise Exception("OpenWeatherMap API key is not configured")

        try:
            location_data = await get_location_data(ip_address, location_name)
            cache_key = location_data["cache_key"]

            cached_weather = await get_cache(cache_key)
            if cached_weather:
                logger_msg = f"Using cached weather data for {'location: ' + location_name if location_name else 'IP: ' + ip_address}"
                logger.info(logger_msg)
                yield f"data: {json.dumps({'intent': 'weather', 'weather_data': cached_weather})}\n\n"
                yield "data: [DONE]\n\n"
                return

            weather = await prepare_weather_data(
                location_data["lat"], location_data["lon"], location_data, api_key
            )

            logger.info(f"Caching weather data with key: {cache_key}")
            await set_cache(cache_key, weather, ONE_HOUR_TTL)

            yield f"data: {json.dumps({'intent': 'weather', 'weather_data': weather})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            error_msg = (
                f"Could not find location: {location_name}"
                if location_name
                else f"Failed to get location from IP: {ip_address}"
            )
            logger.error(f"Error getting location data: {str(e)}")
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
            yield "data: [DONE]\n\n"
            return

    except Exception as e:
        logger.error(f"Error fetching weather: {str(e)}")
        yield f"data: {json.dumps({'error': f'Failed to fetch weather: {str(e)}'})}\n\n"
        yield "data: [DONE]\n\n"


def process_forecast_data(forecast_data: Dict) -> List[Dict]:
    """
    Process raw forecast data from OpenWeatherMap API into daily summaries.

    Args:
        forecast_data (Dict): Raw forecast data from OpenWeatherMap API

    Returns:
        List[Dict]: List of daily forecast summaries
    """

    daily_data = defaultdict(list)

    for item in forecast_data.get("list", []):
        # Convert timestamp to date string (YYYY-MM-DD)
        dt_txt = item.get("dt_txt", "")
        if dt_txt:
            date = dt_txt.split(" ")[0]  # Extract date part
            daily_data[date].append(item)

    # Create a summary for each day
    daily_forecasts = []

    for date, items in daily_data.items():
        if not items:
            continue

        # Calculate min and max temperatures for the day
        temps = [item["main"]["temp"] for item in items]
        min_temp = min(temps)
        max_temp = max(temps)

        # Get the most common weather condition for the day
        weather_conditions = [item["weather"][0]["main"] for item in items]
        weather_descriptions = [item["weather"][0]["description"] for item in items]

        # Use the most frequent condition (simple approach)
        from collections import Counter

        condition_counter = Counter(weather_conditions)
        description_counter = Counter(weather_descriptions)
        most_common_condition = condition_counter.most_common(1)[0][0]
        most_common_description = description_counter.most_common(1)[0][0]

        # Find a matching weather icon from one of the items with this condition
        icon = next(
            (
                item["weather"][0]["icon"]
                for item in items
                if item["weather"][0]["main"] == most_common_condition
            ),
            items[0]["weather"][0]["icon"],
        )

        # Extract timestamp from first item of the day for frontend date formatting
        timestamp = items[0]["dt"]

        # Calculate average humidity
        humidity = sum(item["main"]["humidity"] for item in items) / len(items)

        # Create the daily summary
        daily_summary = {
            "date": date,
            "timestamp": timestamp,
            "temp_min": min_temp,
            "temp_max": max_temp,
            "humidity": round(humidity),
            "weather": {
                "main": most_common_condition,
                "description": most_common_description,
                "icon": icon,
            },
        }

        daily_forecasts.append(daily_summary)

    # Sort by date
    daily_forecasts.sort(key=lambda x: x["date"])

    return daily_forecasts


async def geocode_location(location_name: str) -> Dict[str, Any]:
    """
    Geocode a location name to latitude and longitude using OpenStreetMap Nominatim API.

    Args:
        location_name (str): The name of the location to geocode

    Returns:
        Dict[str, Any]: Dictionary containing location data including latitude and longitude
    """
    try:
        # OpenStreetMap Nominatim API follows usage policy requiring a valid user agent
        headers = {
            "User-Agent": "GAIA-Backend/1.0"  # Properly identify your application
        }

        params = {"q": location_name, "format": "json", "limit": 1}

        nominatim_url = "https://nominatim.openstreetmap.org/search"
        response = await http_async_client.get(
            nominatim_url, params=params, headers=headers
        )
        response.raise_for_status()

        results = response.json()

        if not results:
            raise Exception(f"Location '{location_name}' not found")

        location_data = results[0]

        # Return a dictionary with the geocoded information
        return {
            "lat": float(location_data.get("lat")),
            "lon": float(location_data.get("lon")),
            "display_name": location_data.get("display_name"),
            "city": location_data.get("address", {}).get("city"),
            "country": location_data.get("address", {}).get("country"),
            "region": location_data.get("address", {}).get("state"),
        }

    except Exception as e:
        logger.error(f"Error geocoding location '{location_name}': {str(e)}")
        raise Exception(f"Failed to geocode location: {str(e)}")


async def extract_location_from_message(message: str) -> str:
    """
    Extract location names from a user message using simple heuristics.

    This function looks for common location indicators like:
    - "weather in X"
    - "how is the weather in X"
    - "what's the weather like in X"

    Args:
        message (str): The user's message text

    Returns:
        str: Extracted location name or None if no location is detected
    """
    message = message.lower().strip()

    # Common patterns for weather-related location queries
    patterns = [
        r"weather (?:for|in|at) (.+)$",
        r"weather (?:of|like in) (.+)$",
        r"(?:what is|what's|how is|how's) (?:the )?weather (?:like |in |at |for )?(.+)$",
        r"(?:temperature|forecast|rain|sunny|cloudy) (?:in|at|for) (.+)$",
        r"is it (?:raining|sunny|cloudy|hot|cold|warm) in (.+)$",
    ]

    import re

    for pattern in patterns:
        match = re.search(pattern, message)
        if match:
            location = match.group(1).strip()
            # Remove trailing punctuation or question marks
            location = re.sub(r"[?.!,;]$", "", location)
            return location

    # If no matches found with patterns, look for location after "in" preposition
    in_match = re.search(r"\bin\s+([A-Za-z\s]+(?:,[A-Za-z\s]+)?)", message)
    if in_match:
        location = in_match.group(1).strip()
        location = re.sub(r"[?.!,;]$", "", location)
        return location

    return None
