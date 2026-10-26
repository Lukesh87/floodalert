from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RainfallCurrentResponse(BaseModel):
    location_id: str
    location_name: str
    timestamp: str
    rainfall_1h_mm: float
    rainfall_3h_mm: float
    rainfall_6h_mm: Optional[float] = None
    rainfall_24h_mm: float
    rainfall_72h_mm: Optional[float] = None
    intensity_category: str # Trace, Light, Moderate, Heavy, Very Heavy
    quality_flag: str # PASSED, SUSPICIOUS, IMPUTED
    source: str
    data_freshness_seconds: int = 0


class RainfallHistoryPoint(BaseModel):
    timestamp: str
    rainfall_mm: float
    cumulative_24h_mm: float
    intensity: str


class RainfallHistoryResponse(BaseModel):
    location_id: str
    location_name: str
    time_window: str # 24h, 72h, 7d
    total_rainfall_mm: float
    peak_intensity_mmh: float
    history: List[RainfallHistoryPoint]
