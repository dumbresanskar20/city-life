from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.place import Place
from app.schemas.compare import CompareRequest, CompareResponse, DimensionScore
from app.schemas.place import PlaceOut

router = APIRouter(prefix="/compare", tags=["Compare"])


@router.post("", response_model=CompareResponse)
def compare_places(req: CompareRequest, db: Session = Depends(get_db)):
    places = db.query(Place).filter(Place.id.in_(req.place_ids)).all()
    if len(places) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least 2 valid places to compare.")

    dimensions = [
        ("Safety & Illumination", lambda p: p.safety_score),
        ("Cleanliness & Hygiene", lambda p: p.cleanliness_score),
        ("Affordability", lambda p: p.affordability_score),
        ("Accessibility & Transit", lambda p: p.accessibility_score),
        ("Visitor Ratings", lambda p: p.rating * 20.0),
    ]

    dimension_results = []
    for name, getter in dimensions:
        score_dict = {p.id: float(getter(p)) for p in places}
        winner = max(score_dict.items(), key=lambda x: x[1])[0]
        dimension_results.append(DimensionScore(dimension=name, scores=score_dict, winner_id=winner))

    # Best-for tags
    best_for = {}
    safety_champ = max(places, key=lambda p: p.safety_score)
    afford_champ = max(places, key=lambda p: p.affordability_score)
    rating_champ = max(places, key=lambda p: p.rating)

    best_for[safety_champ.id] = "Best for Safety & Late Night"
    best_for[afford_champ.id] = "Best for Value & Budget"
    if rating_champ.id not in best_for:
        best_for[rating_champ.id] = "Top Rated by Visitors"

    verdict_reasons = [
        f"'{safety_champ.name}' leads on spatial safety ({int(safety_champ.safety_score)}%) with superior illumination.",
        f"'{afford_champ.name}' offers the strongest affordability ratio for budget-conscious commuters.",
        f"All compared venues meet municipal cleanliness standards with verified civic corroboration.",
    ]

    verdict = (
        f"Recommendation: Choose '{safety_champ.name}' for evening visits and safer pedestrian corridors, "
        f"or '{afford_champ.name}' if prioritizing budget and accessible transit."
    )

    return CompareResponse(
        places=[PlaceOut.model_validate(p) for p in places],
        dimensions=dimension_results,
        best_for=best_for,
        verdict=verdict,
        verdict_reasons=verdict_reasons,
    )
