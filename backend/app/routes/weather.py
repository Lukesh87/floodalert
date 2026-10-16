from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.schemas import WeatherSummary, ForecastItem, WeatherOut
from app.services.weather_service import weather_service
from app.models.models import WeatherData, Location

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("/current", response_model=WeatherSummary)
def get_current_weather(
    lat: float = Query(11.0168, description="Latitude"),
    lon: float = Query(76.9558, description="Longitude")
):
    return weather_service.get_current_weather(lat, lon)

@router.get("/forecast", response_model=List[ForecastItem])
def get_weather_forecast(
    lat: float = Query(11.0168, description="Latitude"),
    lon: float = Query(76.9558, description="Longitude")
):
    return weather_service.get_forecast(lat, lon)

@router.get("/history", response_model=List[WeatherOut])
def get_weather_history(
    location_id: int = Query(1),
    hours: int = Query(24),
    db: Session = Depends(get_db)
):
    history = db.query(WeatherData).filter(
        WeatherData.location_id == location_id
    ).order_by(WeatherData.timestamp.desc()).limit(hours).all()

    if not history:
        # Generate simulated history entries if DB has none for the location
        now = datetime.utcnow()
        history = []
        for i in range(hours):
            w = WeatherData(
                id=1000 + i,
                location_id=location_id,
                temperature=26.0 + (i % 3) * 0.5,
                humidity=82.0 + (i % 5),
                rainfall=max(2.0, 45.0 - i * 1.5),
                rainfall_intensity=max(5.0, 65.0 - i * 2.0),
                wind_speed=14.0,
                weather_condition="Moderate Rain",
                precipitation_prob=75.0,
                timestamp=now - timedelta(hours=i)
            )
            history.append(w)

    return history
