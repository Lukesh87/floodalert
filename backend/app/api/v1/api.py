"""
API v1 Router Configuration
===========================
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    alerts,
    flood,
    health,
    locations,
    model,
    rainfall,
    weather,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(locations.router, tags=["Locations"])
api_router.include_router(weather.router, tags=["Weather"])
api_router.include_router(rainfall.router, tags=["Rainfall"])
api_router.include_router(flood.router, tags=["Flood Risk & Predictions"])
api_router.include_router(alerts.router, tags=["Alerts & Warnings"])
api_router.include_router(model.router, tags=["Machine Learning"])
api_router.include_router(admin.router, tags=["Administration & QA"])
