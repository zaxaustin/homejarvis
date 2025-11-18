# toolkit.py - Definition of agent tools

import requests
import functools

# --- Tool Decorator ---
# In a real application, you might use a library like LangChain for this.
# For our purposes, we'll create a simple decorator that registers the tool.
_tools = {}

def tool(func):
    """A decorator to register a function as a tool."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    _tools[func.__name__] = wrapper
    return wrapper

# --- Weather Tool ---

GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"

@tool
def get_weather_for_city(city_name: str) -> str:
    """
    Fetches the current weather for a given city.
    """
    try:
        # Step 1: Geocode the city name to get coordinates
        geo_params = {'name': city_name, 'count': 1}
        geo_response = requests.get(GEOCODING_API_URL, params=geo_params)
        geo_response.raise_for_status()
        geo_data = geo_response.json()

        if not geo_data.get('results'):
            return f"Could not locate a place named '{city_name}'."

        location = geo_data['results'][0]
        latitude = location['latitude']
        longitude = location['longitude']
        name = location['name']

        # Step 2: Fetch the weather
        weather_params = {
            'latitude': latitude,
            'longitude': longitude,
            'current': 'temperature_2m,weather_code,wind_speed_10m',
            'temperature_unit': 'celsius',
            'wind_speed_unit': 'kmh'
        }
        weather_response = requests.get(WEATHER_API_URL, params=weather_params)
        weather_response.raise_for_status()
        weather_data = weather_response.json()

        # Step 3: Format the output
        current_weather = weather_data['current']
        temp = current_weather['temperature_2m']
        wind_speed = current_weather['wind_speed_10m']
        weather_code = current_weather['weather_code']

        description = "Clear skies"
        if weather_code in [1, 2, 3]:
            description = "Partly cloudy"
        elif weather_code > 40:
            description = "Rainy"

        return f"The current weather in {name} is {temp}°C with {description} and wind speeds of {wind_speed} km/h."

    except requests.exceptions.RequestException as e:
        return f"Error contacting the meteorological office: {e}"
    except (KeyError, IndexError):
        return "There was an issue processing the weather data."

# --- Reminder Tool ---

_reminders = []

@tool
def set_reminder(reminder_text: str) -> str:
    """
    Sets a reminder for the user.
    """
    _reminders.append(reminder_text)
    return f"Reminder set: '{reminder_text}'."

@tool
def get_reminders() -> str:
    """
    Retrieves all of the user's pending reminders.
    """
    if not _reminders:
        return "You have no pending reminders."

    response = "Here are your pending reminders:\n"
    for i, reminder in enumerate(_reminders, 1):
        response += f"{i}. {reminder}\n"
    return response.strip()

# --- Web Search Tool ---
@tool
def web_search(query: str) -> str:
    """
    Searches Wikipedia for information on a given query.
    """
    print(f"TOOL: Searching Wikipedia for '{query}'...")
    try:
        # Using the MediaWiki API (the engine behind Wikipedia)
        WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"

        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srlimit": 3,  # Return the top 3 results
            "srprop": "snippet"
        }

        response = requests.get(WIKIPEDIA_API_URL, params=params)
        response.raise_for_status()
        search_results = response.json()

        # Format the results
        formatted_results = ""
        for result in search_results.get("query", {}).get("search", []):
            formatted_results += f"Title: {result.get('title')}\n"
            # Basic cleaning of the snippet to remove HTML tags
            snippet = result.get('snippet', '').replace('<span class="searchmatch">', '').replace('</span>', '')
            formatted_results += f"Snippet: {snippet}...\n\n"

        if not formatted_results:
            return "No Wikipedia results found."

        return formatted_results.strip()

    except requests.exceptions.RequestException as e:
        return f"An error occurred during the Wikipedia search: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"
