from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# AUTH SCHEMAS
class UserCreate(BaseModel):
    name: str = Field(..., example="Jane Doe")
    email: EmailStr = Field(..., example="jane@example.com")
    password: str = Field(..., min_length=6, example="secret123")
    role: Optional[str] = "USER"

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="admin@floodwarning.gov")
    password: str = Field(..., example="admin123")

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# LOCATION SCHEMAS
class LocationBase(BaseModel):
    name: str = Field(..., example="Gandhipuram Central")
    latitude: float = Field(..., example=11.0168)
    longitude: float = Field(..., example=76.9558)
    elevation: float = Field(default=25.0, example=18.5)
    slope: float = Field(default=3.5, example=2.1)
    zone: str = Field(default="Urban Core", example="Commercial Zone")
    drainage_risk: float = Field(default=0.4, example=0.65)
    historical_flood_count: int = Field(default=3, example=6)

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    slope: Optional[float] = None
    zone: Optional[str] = None
    risk_level: Optional[str] = None
    drainage_risk: Optional[float] = None
    historical_flood_count: Optional[int] = None

class LocationOut(LocationBase):
    id: int
    risk_level: str
    created_at: datetime
    current_rainfall: Optional[float] = 0.0
    water_level: Optional[float] = 0.0
    current_probability: Optional[float] = 0.0
    last_updated: Optional[str] = None

    class Config:
        from_attributes = True

# WEATHER SCHEMAS
class WeatherOut(BaseModel):
    id: int
    location_id: int
    temperature: float
    humidity: float
    rainfall: float
    rainfall_intensity: float
    wind_speed: float
    weather_condition: str
    precipitation_prob: float
    timestamp: datetime

    class Config:
        from_attributes = True

class WeatherSummary(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    rainfall_intensity: float
    wind_speed: float
    weather_condition: str
    precipitation_prob: float
    demo_mode: bool = True

class ForecastItem(BaseModel):
    time: str
    temp: float
    rainfall: float
    condition: str
    pop: float

# PREDICTION SCHEMAS
class PredictionInput(BaseModel):
    location_id: Optional[int] = Field(default=1, example=1)
    rainfall_5min: Optional[float] = Field(default=12.0, example=12.0)
    rainfall_15min: Optional[float] = Field(default=32.0, example=32.0)
    rainfall_30min: Optional[float] = Field(default=51.0, example=51.0)
    rainfall_60min: Optional[float] = Field(default=78.0, example=78.0)
    rainfall_intensity: Optional[float] = Field(default=85.0, example=85.0)
    water_level: Optional[float] = Field(default=68.0, example=68.0)
    water_level_change: Optional[float] = Field(default=12.0, example=12.0)
    temperature: Optional[float] = Field(default=27.0, example=27.0)
    humidity: Optional[float] = Field(default=84.0, example=84.0)
    elevation: Optional[float] = Field(default=12.0, example=12.0)
    slope: Optional[float] = Field(default=2.5, example=2.5)
    historical_flood_count: Optional[int] = Field(default=5, example=5)
    drainage_risk: Optional[float] = Field(default=0.6, example=0.6)

class ForecastHorizons(BaseModel):
    min_30: float = Field(..., alias="30_min", example=0.62)
    min_60: float = Field(..., alias="60_min", example=0.82)
    min_120: float = Field(..., alias="120_min", example=0.91)

    class Config:
        populate_by_name = True

class RiskFactor(BaseModel):
    factor: str
    impact: str
    description: str

class PredictionOut(BaseModel):
    id: Optional[int] = None
    location_id: Optional[int] = None
    location_name: Optional[str] = "Selected Station"
    probability: float = Field(..., example=0.82)
    risk_level: str = Field(..., example="HIGH")
    forecast: Dict[str, float]
    explanation: str
    risk_factors: List[RiskFactor] = []
    created_at: Optional[datetime] = None

# ALERT SCHEMAS
class AlertCreate(BaseModel):
    location_id: int
    severity: str
    title: str
    message: str
    recommendation: Optional[str] = None

class AlertOut(BaseModel):
    id: int
    location_id: int
    location_name: Optional[str] = "Station"
    severity: str
    title: str
    message: str
    recommendation: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# DASHBOARD SCHEMAS
class DashboardSummary(BaseModel):
    current_rainfall: float
    rainfall_intensity: float
    water_level: float
    temperature: float
    humidity: float
    current_flood_risk: float
    risk_status: str
    active_alerts: int
    monitored_locations: int
    demo_mode: bool = True

class RiskMapItem(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    elevation: float
    zone: str
    risk_level: str
    current_rainfall: float
    water_level: float
    flood_probability: float
    prediction_time: str = "30–60 minutes"
    last_updated: str

class RainfallTrendItem(BaseModel):
    time: str
    rainfall: float
    water_level: float
    predicted_probability: float

# SIMULATION SCHEMAS
class SimulationInput(BaseModel):
    location_id: int = Field(default=1)
    rainfall_intensity: float = Field(..., example=80.0, description="mm/hr")
    water_level: float = Field(..., example=110.0, description="cm")
    duration_minutes: int = Field(default=60, example=60)
    elevation_override: Optional[float] = None

class SimulationOut(BaseModel):
    current_probability: float
    simulated_probability: float
    current_risk_level: str
    simulated_risk_level: str
    probability_increase: float
    forecast: Dict[str, float]
    explanation: str
    contributing_factors: List[RiskFactor]
