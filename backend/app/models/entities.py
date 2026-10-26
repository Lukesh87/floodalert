"""
Database Models for Urban Flood Nowcasting System
=================================================
Includes locations, weather observations, rainfall timeseries,
verified flood incidents, model predictions, alert management,
and audit logs.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class Location(Base):
    __tablename__ = "locations"

    id = Column(String(50), primary_key=True, index=True) # e.g. "CBE-01"
    name = Column(String(150), nullable=False, index=True)
    ward = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    slope_deg = Column(Float, nullable=False, default=1.0)
    drainage_capacity_index = Column(Float, nullable=False, default=0.5) # 0.0 to 1.0
    impervious_ratio = Column(Float, nullable=False, default=0.8) # 0.0 to 1.0
    risk_baseline = Column(String(50), default="Moderate") # Low, Moderate, High, Severe
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    weather_observations = relationship("WeatherObservation", back_populates="location", cascade="all, delete-orphan")
    rainfall_observations = relationship("RainfallObservation", back_populates="location", cascade="all, delete-orphan")
    flood_events = relationship("FloodEvent", back_populates="location")
    predictions = relationship("FloodPrediction", back_populates="location")
    alerts = relationship("Alert", back_populates="location")


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(String(50), ForeignKey("locations.id"), nullable=False, index=True)
    observation_time = Column(DateTime(timezone=True), nullable=False, index=True)
    temperature_c = Column(Float, nullable=True)
    relative_humidity_pct = Column(Float, nullable=True)
    surface_pressure_hpa = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    wind_direction_deg = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True) # WMO weather interpretation code
    weather_description = Column(String(100), nullable=True)
    is_forecast = Column(Boolean, default=False)
    source = Column(String(100), default="Open-Meteo API")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    location = relationship("Location", back_populates="weather_observations")


class RainfallObservation(Base):
    __tablename__ = "rainfall_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(String(50), ForeignKey("locations.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    rainfall_1h_mm = Column(Float, nullable=False, default=0.0)
    rainfall_3h_mm = Column(Float, nullable=False, default=0.0)
    rainfall_6h_mm = Column(Float, nullable=True)
    rainfall_24h_mm = Column(Float, nullable=False, default=0.0)
    rainfall_72h_mm = Column(Float, nullable=True)
    intensity_category = Column(String(50), default="Light") # Trace, Light, Moderate, Heavy, Very Heavy
    quality_flag = Column(String(50), default="PASSED") # PASSED, SUSPICIOUS, IMPUTED
    source = Column(String(100), default="Open-Meteo / IMD")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    location = relationship("Location", back_populates="rainfall_observations")


class FloodEvent(Base):
    __tablename__ = "flood_events"

    id = Column(String(50), primary_key=True, index=True) # e.g. "CBE-FLD-2021-01"
    event_name = Column(String(200), nullable=False)
    incident_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    location_id = Column(String(50), ForeignKey("locations.id"), nullable=True)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rainfall_1h_mm = Column(Float, nullable=True)
    rainfall_3h_mm = Column(Float, nullable=True)
    rainfall_24h_mm = Column(Float, nullable=True)
    flood_depth_cm = Column(Float, nullable=True)
    severity = Column(String(50), nullable=False) # Low, Moderate, High, Severe
    impact_summary = Column(Text, nullable=False)
    source = Column(String(200), nullable=False)
    verification_status = Column(String(50), default="Verified Official") # Verified Official, Verified Corroborated, Unverified, Synthetic
    created_at = Column(DateTime(timezone=True), default=utc_now)

    location = relationship("Location", back_populates="flood_events")


class FloodPrediction(Base):
    __tablename__ = "flood_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(String(50), ForeignKey("locations.id"), nullable=False, index=True)
    prediction_timestamp = Column(DateTime(timezone=True), nullable=False, default=utc_now, index=True)
    forecast_horizon_hours = Column(Integer, default=3)
    input_rainfall_1h = Column(Float, nullable=False)
    input_rainfall_3h = Column(Float, nullable=False)
    input_rainfall_24h = Column(Float, nullable=False)
    input_soil_moisture = Column(Float, nullable=True)
    risk_category = Column(String(50), nullable=False) # Low, Moderate, High, Severe
    risk_level = Column(Integer, nullable=False) # 0, 1, 2, 3
    flood_probability = Column(Float, nullable=False) # 0.0 to 1.0
    uncertainty_score = Column(Float, nullable=False) # 0.0 to 1.0
    uncertainty_level = Column(String(50), default="Low")
    top_contributing_factors = Column(Text, nullable=True) # JSON serialized
    recommended_action = Column(Text, nullable=True)
    model_version = Column(String(50), default="1.0.0-cbe-rf")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    location = relationship("Location", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True) # e.g. "ALT-20261022-001"
    alert_code = Column(String(50), nullable=False, index=True)
    severity = Column(String(50), nullable=False) # Advisory, Watch, Warning, Emergency
    status = Column(String(50), default="Active") # Active, Acknowledged, Resolved, Expired
    location_id = Column(String(50), ForeignKey("locations.id"), nullable=False, index=True)
    location_name = Column(String(150), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    source_trigger = Column(String(100), default="Automated Nowcast ML Model")
    triggered_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    cooldown_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    location = relationship("Location", back_populates="alerts")


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    provider = Column(String(150), nullable=False)
    endpoint_url = Column(String(300), nullable=True)
    update_frequency_min = Column(Integer, default=15)
    status = Column(String(50), default="HEALTHY") # HEALTHY, DEGRADED, OFFLINE
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_status_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(100), nullable=False) # e.g. ALERT_ACKNOWLEDGED, DATA_INGESTION, PREDICTION_RUN
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    actor = Column(String(100), default="SYSTEM")
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
