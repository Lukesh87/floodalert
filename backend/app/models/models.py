from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="USER", nullable=False)  # USER, ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, default=25.0)  # meters
    slope = Column(Float, default=3.5)        # degrees
    zone = Column(String(100), default="Urban Core")
    risk_level = Column(String(20), default="LOW")  # LOW, MODERATE, HIGH, CRITICAL
    drainage_risk = Column(Float, default=0.4)
    historical_flood_count = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    weather_readings = relationship("WeatherData", back_populates="location", cascade="all, delete-orphan")
    water_readings = relationship("WaterLevel", back_populates="location", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="location", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="location", cascade="all, delete-orphan")
    flood_events = relationship("FloodEvent", back_populates="location", cascade="all, delete-orphan")

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    temperature = Column(Float, nullable=False)      # °C
    humidity = Column(Float, nullable=False)         # %
    rainfall = Column(Float, nullable=False)         # mm (last hour)
    rainfall_intensity = Column(Float, default=0.0) # mm/hr
    wind_speed = Column(Float, default=10.0)        # km/h
    weather_condition = Column(String(50), default="Heavy Rain")
    precipitation_prob = Column(Float, default=80.0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    location = relationship("Location", back_populates="weather_readings")

class WaterLevel(Base):
    __tablename__ = "water_levels"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    water_level = Column(Float, nullable=False)        # cm
    water_level_change = Column(Float, default=0.0)    # cm per 15 min
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    location = relationship("Location", back_populates="water_readings")

class FloodEvent(Base):
    __tablename__ = "flood_events"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    severity = Column(String(20), nullable=False)       # LOW, MODERATE, HIGH, CRITICAL
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)

    location = relationship("Location", back_populates="flood_events")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    probability_30 = Column(Float, nullable=False)  # 0.0 - 1.0
    probability_60 = Column(Float, nullable=False)
    probability_120 = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    explanation = Column(Text, nullable=True)
    model_version = Column(String(50), default="RandomForest v1.0")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    location = relationship("Location", back_populates="predictions")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    severity = Column(String(20), nullable=False)    # LOW, MODERATE, HIGH, CRITICAL
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE")    # ACTIVE, READ, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    location = relationship("Location", back_populates="alerts")
