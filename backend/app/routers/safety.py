from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.incident import Incident
from app.models.hotspot import Hotspot
from app.schemas.safety import HeatmapPoint, HotspotOut, SafetyScoreResponse
from app.ml.safety_score import compute_safety_score_at_point

router = APIRouter(prefix="/safety", tags=["Safety"])


@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap(
    hour: Optional[int] = Query(14, ge=0, le=23),
    bbox: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    incidents = db.query(Incident).all()
    points = []

    # Time weight modifier
    is_night = hour < 5 or hour >= 21
    time_multiplier = 1.35 if is_night else 1.0

    for inc in incidents:
        w = round((inc.severity / 5.0) * (inc.weight or 1.0) * time_multiplier, 2)
        points.append(HeatmapPoint(lat=inc.lat, lng=inc.lng, weight=min(1.0, w)))

    return points


@router.get("/hotspots", response_model=List[HotspotOut])
def get_hotspots(
    bucket: Optional[str] = Query(None, description="morning, afternoon, evening, night"),
    db: Session = Depends(get_db),
):
    query = db.query(Hotspot)
    if bucket:
        query = query.filter(Hotspot.time_bucket == bucket)
    return query.order_by(Hotspot.risk_score.desc()).all()


@router.get("/score", response_model=SafetyScoreResponse)
def get_safety_score(
    lat: float = Query(...),
    lng: float = Query(...),
    hour: int = Query(14, ge=0, le=23),
    db: Session = Depends(get_db),
):
    return compute_safety_score_at_point(db=db, lat=lat, lng=lng, hour=hour)
