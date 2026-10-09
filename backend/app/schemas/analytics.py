from typing import Dict, List
from pydantic import BaseModel
from app.schemas.place import PlaceOut
from app.schemas.safety import HotspotOut


class CategoryStat(BaseModel):
    category: str
    count: int


class HourStat(BaseModel):
    hour: int
    count: int


class VerificationStat(BaseModel):
    status: str
    count: int
    percentage: float


class AnalyticsSummaryResponse(BaseModel):
    total_incidents: int
    total_reports: int
    active_hotspots_count: int
    incidents_by_category: List[CategoryStat]
    incidents_by_hour: List[HourStat]
    verification_breakdown: List[VerificationStat]
    top_places: List[PlaceOut]
    bottom_places: List[PlaceOut]
    recent_hotspots: List[HotspotOut]
