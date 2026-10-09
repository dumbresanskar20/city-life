from typing import Dict, List
from pydantic import BaseModel


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    weight: float


class HotspotOut(BaseModel):
    id: int
    centroid_lat: float
    centroid_lng: float
    radius_m: float
    risk_score: float
    incident_count: int
    time_bucket: str

    class Config:
        from_attributes = True


class SafetyBreakdown(BaseModel):
    incident_density: float
    severity_factor: float
    time_of_day_factor: float
    lighting_score: float
    footfall_proxy: float


class SafetyScoreResponse(BaseModel):
    lat: float
    lng: float
    hour: int
    safety_score: float  # 0-100 (higher = safer)
    risk_score: float    # 0-1
    risk_level: str      # safe, caution, danger
    breakdown: SafetyBreakdown
    explanation: str
