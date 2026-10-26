from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WeatherCurrentResponse(BaseModel):
    location_id: str
    location_name: str
    latitude: float
    longitude: float
    observation_time: str
    temperature_c: Optional[float]
    relative_humidity_pct: Optional[float]
    surface_pressure_hpa: Optional[float]
    wind_speed_kmh: Optional[float]
    wind_direction_deg: Optional[float]
    weather_code: Optional[int]
    weather_description: str
    is_day: Optional[int] = 1
    data_freshness_seconds: int = 0
    source: str = "Open-Meteo Weather API"
    provider_status: str = "LIVE" # LIVE or CACHED or UNAVAILABLE


class HourlyForecastItem(BaseModel):
    time: str
    temperature_c: float
    precipitation_probability: int
    rainfall_mm: float
    weather_description: str


class WeatherForecastResponse(BaseModel):
    location_id: str
    location_name: str
    generated_at: str
    hourly: List[HourlyForecastItem]


class WeatherApiKeyConfig(BaseModel):
    provider: str = Field(default="openweathermap", description="Provider name: openweathermap, weatherapi, openmeteo")
    api_key: str = Field(..., description="API key token")


class WeatherStatusResponse(BaseModel):
    active_provider: str
    has_api_key: bool
    masked_api_key: Optional[str] = None
    provider_status: str
    cache_ttl_seconds: int
    last_updated: Optional[str] = None
    source: str


class WeatherKeyTestResponse(BaseModel):
    success: bool
    provider: str
    message: str
    sample_temp_c: Optional[float] = None
    sample_condition: Optional[str] = None
    sample_humidity_pct: Optional[float] = None
