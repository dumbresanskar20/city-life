from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    origin: List[float] = Field(..., description="[lat, lng]")
    destination: List[float] = Field(..., description="[lat, lng]")
    hour: int = Field(default=14, ge=0, le=23)
    priority: str = Field(default="balanced", description="fastest, safest, balanced")


class WorstSegment(BaseModel):
    lat: float
    lng: float
    risk: float
    description: str


class TurnStep(BaseModel):
    instruction: str
    distance_m: float
    duration_s: float


class RouteAlternative(BaseModel):
    label: str  # "Fastest", "Safest", "Balanced"
    color: str
    dash_pattern: str  # "solid", "dashed", "dotted"
    geometry: List[List[float]]  # [[lat, lng], ...]
    duration_min: float
    distance_km: float
    risk_score: float  # 0 to 100
    risk_profile: List[float]  # Sampled points for mini area chart
    worst_segment: WorstSegment
    tradeoff_text: str  # e.g., "+4 min, 38% lower risk"
    turn_by_turn: List[TurnStep]


class RouteResponse(BaseModel):
    origin: List[float]
    destination: List[float]
    routes: List[RouteAlternative]
    recommended_route: str
