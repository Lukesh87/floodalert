import random
import requests
from datetime import datetime, timedelta
from app.config import settings

class WeatherService:
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY
        self.demo_mode = settings.DEMO_MODE or not bool(self.api_key)

    def get_current_weather(self, lat: float = 11.0168, lon: float = 76.9558) -> dict:
        if not self.demo_mode and self.api_key:
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    rainfall_1h = data.get("rain", {}).get("1h", 0.0)
                    return {
                        "temperature": round(data["main"]["temp"], 1),
                        "humidity": float(data["main"]["humidity"]),
                        "rainfall": round(rainfall_1h, 1),
                        "rainfall_intensity": round(rainfall_1h * 1.3, 1),
                        "wind_speed": round(data["wind"]["speed"] * 3.6, 1), # km/h
                        "weather_condition": data["weather"][0]["main"],
                        "precipitation_prob": 80.0 if rainfall_1h > 0 else 20.0,
                        "demo_mode": False
                    }
            except Exception as e:
                print(f"Weather API request failed: {e}. Falling back to DEMO mode.")

        # DEMO MODE Dynamic Generator
        now_minute = datetime.utcnow().minute
        # Fluctuating rain simulation based on time
        base_rain = 25.0 + 15.0 * random.uniform(-0.5, 0.8)
        intensity = round(base_rain * random.uniform(1.1, 1.4), 1)

        return {
            "temperature": round(26.5 + random.uniform(-1.5, 1.5), 1),
            "humidity": round(84.0 + random.uniform(-4, 6), 1),
            "rainfall": round(base_rain, 1),
            "rainfall_intensity": intensity,
            "wind_speed": round(16.0 + random.uniform(-3, 5), 1),
            "weather_condition": "Heavy Rain Showers",
            "precipitation_prob": 88.0,
            "demo_mode": True
        }

    def get_forecast(self, lat: float = 11.0168, lon: float = 76.9558) -> list:
        # Generates hourly forecast for next 24 hours
        forecast = []
        base_time = datetime.utcnow()
        conditions = ["Heavy Rain", "Thunderstorm", "Moderate Rain", "Light Rain", "Cloudy"]

        for i in range(24):
            time_slot = base_time + timedelta(hours=i)
            rain_val = max(0.0, round(35.0 - (i * 1.2) + random.uniform(-5, 8), 1))
            forecast.append({
                "time": time_slot.strftime("%H:00"),
                "temp": round(25.0 + random.uniform(-2, 3), 1),
                "rainfall": rain_val,
                "condition": "Heavy Rain" if rain_val > 25 else ("Light Rain" if rain_val > 5 else "Overcast"),
                "pop": min(100.0, max(10.0, round(90.0 - (i * 3.0), 1)))
            })
        return forecast

weather_service = WeatherService()
