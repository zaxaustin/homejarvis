
# skills/weather.py
# This skill allows J.A.R.V.I.S. to fetch the weather for a given location.

import requests

GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"

def get_weather_for_city(city_name):
    """
    Fetches the weather for a given city by first geocoding it.
    """
    try:
        # Step 1: Geocode the city name to get coordinates
        geo_params = {'name': city_name, 'count': 1}
        geo_response = requests.get(GEOCODING_API_URL, params=geo_params)
        geo_response.raise_for_status()  # Raises an exception for bad status codes
        geo_data = geo_response.json()

        if not geo_data.get('results'):
            return f"I'm sorry, Sir, I could not locate a place named '{city_name}'."

        location = geo_data['results'][0]
        latitude = location['latitude']
        longitude = location['longitude']
        name = location['name']

        # Step 2: Fetch the weather for the coordinates
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
        
        # A simple interpretation of weather codes. Not exhaustive, but sufficient for now.
        weather_code = current_weather['weather_code']
        description = "Clear skies"
        if weather_code in [1, 2, 3]:
            description = "Partly cloudy"
        elif weather_code > 40:
            description = "Rainy"
        
        return f"The current weather in {name} is {temp}°C with wind speeds of {wind_speed} km/h. Conditions are: {description}."

    except requests.exceptions.RequestException as e:
        return f"I seem to be having trouble contacting the meteorological office, Sir. Error: {e}"
    except (KeyError, IndexError):
        return "There was an unexpected issue processing the weather data, Sir."

