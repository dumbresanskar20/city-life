from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.incident import Incident
from app.models.report import Report
from app.models.hotspot import Hotspot
from app.models.place import Place
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    CategoryStat,
    HourStat,
    VerificationStat,
)
from app.schemas.place import PlaceOut
from app.schemas.safety import HotspotOut

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    reports = db.query(Report).all()
    hotspots = db.query(Hotspot).all()

    # Category breakdown
    cat_counts = Counter(i.category for i in incidents)
    incidents_by_category = [CategoryStat(category=k, count=v) for k, v in cat_counts.most_common()]

    # Hour breakdown
    hour_counts = Counter(i.occurred_at.hour for i in incidents)
    incidents_by_hour = [HourStat(hour=h, count=hour_counts.get(h, 0)) for h in range(24)]

    # Verification breakdown
    status_counts = Counter(r.verification_status for r in reports)
    total_r = max(1, len(reports))
    verification_breakdown = [
        VerificationStat(status=k, count=v, percentage=round((v / total_r) * 100, 1))
        for k, v in status_counts.items()
    ]

    # Top & bottom places by overall score
    top_places = db.query(Place).order_by(Place.overall_score.desc()).limit(5).all()
    bottom_places = db.query(Place).order_by(Place.overall_score.asc()).limit(5).all()

    return AnalyticsSummaryResponse(
        total_incidents=len(incidents),
        total_reports=len(reports),
        active_hotspots_count=len(hotspots),
        incidents_by_category=incidents_by_category,
        incidents_by_hour=incidents_by_hour,
        verification_breakdown=verification_breakdown,
        top_places=[PlaceOut.model_validate(p) for p in top_places],
        bottom_places=[PlaceOut.model_validate(p) for p in bottom_places],
        recent_hotspots=[HotspotOut.model_validate(h) for h in hotspots[:6]],
    )
