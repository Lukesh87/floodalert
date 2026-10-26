from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AlertBase(BaseModel):
    severity: str = Field(..., description="Advisory, Watch, Warning, Emergency")
    location_id: str
    location_name: str
    title: str
    description: str
    reason: str
    source_trigger: str = "Automated Nowcast ML Model"


class AlertCreate(AlertBase):
    expires_in_hours: Optional[int] = 6


class AlertUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Active, Acknowledged, Resolved, Expired")
    acknowledged_by: Optional[str] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    alert_code: str
    severity: str
    status: str
    location_id: str
    location_name: str
    title: str
    description: str
    reason: str
    source_trigger: str
    triggered_at: str
    expires_at: str
    acknowledged_at: Optional[str] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[str] = None
    cooldown_until: Optional[str] = None
    is_active: bool
