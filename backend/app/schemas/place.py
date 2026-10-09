from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PlaceBase(BaseModel):
    name: str
    category: str
    subcategory: Optional[str] = None
    lat: float
    lng: float
    address: Optional[str] = None
    price_level: int = 2
    rating: float = 4.0
    rating_count: int = 0
    opening_hours: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    accessibility: Dict[str, Any] = Field(default_factory=dict)
    cleanliness_score: float = 70.0
    safety_score: float = 75.0
    affordability_score: float = 65.0
    accessibility_score: float = 70.0
    overall_score: float = 72.0
    photo_url: Optional[str] = None
    source: str = "osm"


class PlaceOut(PlaceBase):
    id: int
    osm_id: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlaceExplainResponse(BaseModel):
    place_id: int
    name: str
    category: str
    headline_score: float
    headline_summary: str
    dimensions: Dict[str, float]
    breakdown_reasons: List[str]
    nearby_reports_count: int
    recommendation_why: str
