from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class LocationBase(BaseModel):
    id: str = Field(..., description="Unique station ID (e.g., CBE-01)")
    name: str = Field(..., description="Station or catchment name")
    ward: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    elevation_m: float = Field(..., description="Elevation above MSL in meters")
    slope_deg: float = Field(default=1.0, ge=0)
    drainage_capacity_index: float = Field(default=0.5, ge=0.0, le=1.0)
    impervious_ratio: float = Field(default=0.8, ge=0.0, le=1.0)
    risk_baseline: str = Field(default="Moderate")
    description: Optional[str] = None
    is_active: bool = True


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
