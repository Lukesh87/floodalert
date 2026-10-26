"""
Weather & Atmospheric Observations Endpoint with Real-Time API Key Support
===========================================================================
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import Location
from app.schemas.weather import (
    HourlyForecastItem,
    WeatherApiKeyConfig,
    WeatherCurrentResponse,
    WeatherForecastResponse,
    WeatherKeyTestResponse,
    WeatherStatusResponse,
)
from app.services.weather_service import (
    clear_runtime_weather_key,
    fetch_coimbatore_weather,
    get_active_provider_and_key,
    get_weather_desc,
    mask_key,
    set_runtime_weather_key,
    test_weather_api_key,
)

router = APIRouter()


@router.get("/weather/current", response_model=WeatherCurrentResponse, summary="Get Current Weather Observations")
async def get_current_weather(
    location_id: Optional[str] = Query(None, description="Optional station ID"),
    db: Session = Depends(get_db),
):
    lat = settings.DEFAULT_LATITUDE
    lon = settings.DEFAULT_LONGITUDE
    loc_name = "Coimbatore Urban Agglomeration"
    target_id = "CBE-CITY"

    if location_id:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found.")
        lat = loc.latitude
        lon = loc.longitude
        loc_name = loc.name
        target_id = loc.id

    data = await fetch_coimbatore_weather(lat=lat, lon=lon)

    return WeatherCurrentResponse(
        location_id=target_id,
        location_name=loc_name,
        latitude=data["latitude"],
        longitude=data["longitude"],
        observation_time=data["observation_time"],
        temperature_c=data["temperature_c"],
        relative_humidity_pct=data["relative_humidity_pct"],
        surface_pressure_hpa=data["surface_pressure_hpa"],
        wind_speed_kmh=data["wind_speed_kmh"],
        wind_direction_deg=data["wind_direction_deg"],
        weather_code=data["weather_code"],
        weather_description=data["weather_description"],
        is_day=data["is_day"],
        data_freshness_seconds=data.get("data_freshness_seconds", 0),
        source=data["source"],
        provider_status=data["provider_status"],
    )


@router.get("/weather/forecast", response_model=WeatherForecastResponse, summary="Get Short-Term Forecast")
async def get_weather_forecast(
    location_id: Optional[str] = Query(None, description="Optional station ID"),
    db: Session = Depends(get_db),
):
    lat = settings.DEFAULT_LATITUDE
    lon = settings.DEFAULT_LONGITUDE
    loc_name = "Coimbatore (Central)"
    target_id = "CBE-CITY"

    if location_id:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if loc:
            lat = loc.latitude
            lon = loc.longitude
            loc_name = loc.name
            target_id = loc.id

    data = await fetch_coimbatore_weather(lat=lat, lon=lon)
    raw_hourly = data.get("raw_hourly", {})

    times = raw_hourly.get("time", [])[:24]
    temps = raw_hourly.get("temperature_2m", [])[:24]
    probs = raw_hourly.get("precipitation_probability", [])[:24]
    precips = raw_hourly.get("precipitation", [])[:24]
    codes = raw_hourly.get("weather_code", [])[:24]

    items: List[HourlyForecastItem] = []
    for i in range(len(times)):
        code = codes[i] if i < len(codes) else None
        items.append(
            HourlyForecastItem(
                time=times[i],
                temperature_c=temps[i] if i < len(temps) else 28.0,
                precipitation_probability=int(probs[i]) if i < len(probs) and probs[i] is not None else 20,
                rainfall_mm=round(float(precips[i]), 1) if i < len(precips) and precips[i] is not None else 0.0,
                weather_description=get_weather_desc(code),
            )
        )

    return WeatherForecastResponse(
        location_id=target_id,
        location_name=loc_name,
        generated_at=data["observation_time"],
        hourly=items,
    )


@router.get("/weather/status", response_model=WeatherStatusResponse, summary="Get Weather Provider & API Key Status")
async def get_weather_status():
    provider, key = get_active_provider_and_key()
    has_key = bool(key)
    masked = mask_key(key)

    source_label = (
        "OpenWeatherMap Real-Time API"
        if provider == "openweathermap" and has_key
        else "WeatherAPI.com Real-Time API"
        if provider == "weatherapi" and has_key
        else "Open-Meteo High-Resolution Numerical Model (Free)"
    )

    return WeatherStatusResponse(
        active_provider=provider,
        has_api_key=has_key,
        masked_api_key=masked,
        provider_status="AUTHENTICATED_KEY" if has_key else "FREE_TIER",
        cache_ttl_seconds=settings.WEATHER_CACHE_TTL_SECONDS,
        last_updated=None,
        source=source_label,
    )


@router.post("/weather/test-key", response_model=WeatherKeyTestResponse, summary="Test Weather API Key Connection")
async def test_key(config: WeatherApiKeyConfig):
    res = await test_weather_api_key(
        provider=config.provider,
        api_key=config.api_key,
        lat=settings.DEFAULT_LATITUDE,
        lon=settings.DEFAULT_LONGITUDE,
    )
    return WeatherKeyTestResponse(
        success=res.get("success", False),
        provider=res.get("provider", config.provider),
        message=res.get("message", "Test completed."),
        sample_temp_c=res.get("sample_temp_c"),
        sample_condition=res.get("sample_condition"),
        sample_humidity_pct=res.get("sample_humidity_pct"),
    )


@router.post("/weather/configure-key", response_model=WeatherKeyTestResponse, summary="Configure and Activate Weather API Key")
async def configure_key(config: WeatherApiKeyConfig):
    test_res = await test_weather_api_key(
        provider=config.provider,
        api_key=config.api_key,
        lat=settings.DEFAULT_LATITUDE,
        lon=settings.DEFAULT_LONGITUDE,
    )

    if test_res.get("success"):
        set_runtime_weather_key(config.provider, config.api_key)
        return WeatherKeyTestResponse(
            success=True,
            provider=test_res.get("provider", config.provider),
            message="Weather API key validated and activated live! Telemetry cache refreshed.",
            sample_temp_c=test_res.get("sample_temp_c"),
            sample_condition=test_res.get("sample_condition"),
            sample_humidity_pct=test_res.get("sample_humidity_pct"),
        )
    else:
        return WeatherKeyTestResponse(
            success=False,
            provider=test_res.get("provider", config.provider),
            message=test_res.get("message", "Key validation failed."),
        )


@router.post("/weather/clear-key", summary="Clear Runtime Weather Key")
async def clear_key():
    clear_runtime_weather_key()
    return {"success": True, "message": "Runtime weather API key cleared; reverted to standard configuration."}
