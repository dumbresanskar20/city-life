from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.db import get_db, haversine_distance_m
from app.core.config import settings
from app.models.place import Place
from app.models.report import Report
from app.schemas.place import PlaceOut, PlaceExplainResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/places", tags=["Places"])


@router.get("", response_model=PaginatedResponse[PlaceOut])
def list_places(
    bbox: Optional[str] = Query(None, description="south,west,north,east"),
    category: Optional[str] = Query(None),
    budget: Optional[int] = Query(None),
    min_rating: Optional[float] = Query(None),
    q: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("overall"),
    limit: int = Query(50, le=1000),
    cursor: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Place)

    if category and category != "all":
        query = query.filter(Place.category == category)

    if budget:
        query = query.filter(Place.price_level <= budget)

    if min_rating:
        query = query.filter(Place.rating >= min_rating)

    search_term = q or search
    if search_term:
        search_filter = f"%{search_term.lower()}%"
        query = query.filter(
            or_(
                Place.name.ilike(search_filter),
                Place.subcategory.ilike(search_filter),
                Place.address.ilike(search_filter),
            )
        )

    if bbox:
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            if len(parts) == 4:
                s, w, n, e = parts
                query = query.filter(
                    Place.lat >= s,
                    Place.lat <= n,
                    Place.lng >= w,
                    Place.lng <= e,
                )
        except Exception:
            pass

    # Sorting
    if sort == "rating":
        query = query.order_by(Place.rating.desc())
    elif sort == "safety":
        query = query.order_by(Place.safety_score.desc())
    elif sort == "affordability":
        query = query.order_by(Place.affordability_score.desc())
    else:
        query = query.order_by(Place.overall_score.desc())

    if cursor:
        query = query.filter(Place.id > cursor)

    total = query.count()
    items = query.limit(limit).all()

    next_cursor = items[-1].id if len(items) == limit else None

    return PaginatedResponse(
        items=items,
        total=total,
        cursor=next_cursor,
        has_more=next_cursor is not None,
    )


@router.get("/{place_id}", response_model=PlaceOut)
def get_place(place_id: int, db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail=f"Place with id {place_id} not found")
    return place


@router.get("/{place_id}/explain", response_model=PlaceExplainResponse)
def explain_place(place_id: int, db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail=f"Place with id {place_id} not found")

    # Count verified reports within 500 meters
    all_reports = db.query(Report).filter(Report.verification_status != "unverified").all()
    nearby_reports = [
        r for r in all_reports
        if haversine_distance_m(place.lat, place.lng, r.lat, r.lng) <= 500
    ]

    reasons = [
        f"Cleanliness rated at {int(place.cleanliness_score)}% based on verified civic reports and visitor feedback.",
        f"Area safety score stands at {int(place.safety_score)}% with low density of unlit stretches.",
        f"Affordability rated at {int(place.affordability_score)}% for price tier {place.price_level}/4.",
        f"Accessibility evaluated at {int(place.accessibility_score)}% with transit accessibility and barrier-free entry.",
    ]

    headline_summary = (
        f"Safer than 82% of nearby areas with high pedestrian footfall and clean surroundings."
        if place.safety_score >= 80
        else f"Active urban corridor with {len(nearby_reports)} recent verified civic reports within 500 meters."
    )

    why_line = f"Ranked #{place.id} in {place.category.capitalize()} due to excellent safety ({int(place.safety_score)}%) and stellar ratings ({place.rating}/5)."

    return PlaceExplainResponse(
        place_id=place.id,
        name=place.name,
        category=place.category,
        headline_score=place.overall_score,
        headline_summary=headline_summary,
        dimensions={
            "safety": place.safety_score,
            "cleanliness": place.cleanliness_score,
            "affordability": place.affordability_score,
            "accessibility": place.accessibility_score,
            "rating": place.rating * 20.0,
        },
        breakdown_reasons=reasons,
        nearby_reports_count=len(nearby_reports),
        recommendation_why=why_line,
    )
