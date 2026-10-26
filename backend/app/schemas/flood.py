from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FloodEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_name: str
    incident_timestamp: str
    location_id: Optional[str] = None
    location_name: str
    latitude: float
    longitude: float
    rainfall_1h_mm: Optional[float] = None
    rainfall_3h_mm: Optional[float] = None
    rainfall_24h_mm: Optional[float] = None
    flood_depth_cm: Optional[float] = None
    severity: str # Low, Moderate, High, Severe
    impact_summary: str
    source: str
    verification_status: str # Verified Official, Verified Corroborated, Unverified, Synthetic


class FloodPredictionRequest(BaseModel):
    location_id: Optional[str] = Field(None, description="Monitored station ID (e.g. CBE-01)")
    rainfall_1h: float = Field(..., ge=0.0, le=300.0, description="Rainfall in the last 1 hour (mm)")
    rainfall_3h: float = Field(..., ge=0.0, le=500.0, description="Accumulated rainfall over 3 hours (mm)")
    rainfall_24h: float = Field(..., ge=0.0, le=1000.0, description="Accumulated rainfall over 24 hours (mm)")
    elevation_m: Optional[float] = Field(None, ge=100.0, le=2000.0, description="Elevation in meters")
    slope_deg: Optional[float] = Field(None, ge=0.0, le=60.0, description="Slope gradient in degrees")
    drainage_capacity_index: Optional[float] = Field(None, ge=0.05, le=1.0, description="Drainage capacity score")
    soil_moisture_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Soil moisture saturation %")
    impervious_ratio: Optional[float] = Field(None, ge=0.0, le=1.0, description="Impervious surface ratio")


class ContributingFactor(BaseModel):
    feature: str
    value: Any
    weight: float


class FloodPredictionResponse(BaseModel):
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    prediction_timestamp: str
    forecast_horizon_hours: int = 3
    risk_category: str # Low, Moderate, High, Severe
    risk_level: int # 0 to 3
    flood_probability: float # 0.0 to 1.0
    uncertainty_score: float
    uncertainty_level: str
    probabilities: Dict[str, float]
    top_contributing_factors: List[ContributingFactor]
    recommended_action: str
    model_version: str
    model_type: str
    input_summary: Dict[str, Any]
    limitations: str = (
        "Model represents urban surface-runoff flood likelihood for Coimbatore micro-catchments. "
        "Does not account for sudden structural dam/canal failures or sudden debris obstructions. "
        "Supplements official TNDSMA and CCMC emergency bulletins."
    )


class FloodRiskMapItem(BaseModel):
    location_id: str
    location_name: str
    latitude: float
    longitude: float
    elevation_m: float
    risk_category: str
    risk_level: int
    flood_probability: float
    rainfall_1h_mm: float
    rainfall_24h_mm: float
    status: str # NORMAL, WATCH, WARNING, CRITICAL
    last_updated: str
