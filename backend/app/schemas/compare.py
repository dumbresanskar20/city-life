from typing import Dict, List
from pydantic import BaseModel, Field
from app.schemas.place import PlaceOut


class CompareRequest(BaseModel):
    place_ids: List[int] = Field(..., min_length=2, max_length=3)


class DimensionScore(BaseModel):
    dimension: str
    scores: Dict[int, float]  # place_id -> score (0-100)
    winner_id: int


class CompareResponse(BaseModel):
    places: List[PlaceOut]
    dimensions: List[DimensionScore]
    best_for: Dict[int, str]  # place_id -> tag e.g. "Best for safety"
    verdict: str
    verdict_reasons: List[str]
