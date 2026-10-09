import math
from datetime import datetime
from typing import Dict, Tuple
from sqlalchemy.orm import Session

from app.core.db import haversine_distance_m
from app.models.incident import Incident
from app.models.place import Place


def compute_safety_score_at_point(
    db: Session,
    lat: float,
    lng: float,
    hour: int = 14,
) -> Dict[str, any]:
    """
    Computes explainable safety score (0-100, higher = safer):
    risk = 0.40*incident_density + 0.20*severity_weighted + 0.15*time_of_day_factor + 0.15*(1 - lighting_score) + 0.10*(1 - footfall_proxy)
    safety = round(100 * (1 - clamp(risk)))
    """
    now = datetime.utcnow()
    sigma_m = 200.0  # 200 meters bandwidth

    # 1. Incident density with Gaussian kernel & recency decay
    incidents = db.query(Incident).all()
    density_accum = 0.0
    severity_sum = 0.0
    weight_sum = 0.0

    for inc in incidents:
        dist_m = haversine_distance_m(lat, lng, inc.lat, inc.lng)
        if dist_m <= 800.0:
            age_days = (now - inc.occurred_at).total_seconds() / 86400.0
            recency = math.exp(-max(0.0, age_days) / 45.0)
            kernel = math.exp(-0.5 * (dist_m / sigma_m) ** 2)
            w = (inc.weight or 0.8) * recency * kernel
            density_accum += w
            severity_sum += inc.severity * w
            weight_sum += w

    # Normalize density into 0-1
    incident_density = min(1.0, density_accum / 4.0)

    # 2. Average severity factor
    if weight_sum > 0:
        avg_severity = severity_sum / weight_sum
        severity_factor = min(1.0, avg_severity / 5.0)
    else:
        severity_factor = 0.2

    # 3. Time of day factor (night 21:00-05:00 is higher risk)
    if 21 <= hour or hour < 5:
        time_factor = 0.85
    elif 18 <= hour < 21:
        time_factor = 0.55
    else:
        time_factor = 0.20

    # 4. Lighting score (0-1) - based on nearby density and infrastructure
    # Pune central / arterial corridors have higher lighting
    lighting_score = 0.75 if (18.51 <= lat <= 18.54 and 73.83 <= lng <= 73.88) else 0.50

    # 5. Footfall proxy (0-1) - density of open shops/places nearby
    places = db.query(Place).all()
    nearby_places_count = sum(1 for p in places if haversine_distance_m(lat, lng, p.lat, p.lng) <= 400.0)
    footfall_proxy = min(1.0, nearby_places_count / 3.0)
    if 18 <= hour <= 21:
        footfall_proxy = min(1.0, footfall_proxy * 1.2)  # evening boost

    # Aggregate Risk equation
    risk = (
        0.40 * incident_density +
        0.20 * severity_factor +
        0.15 * time_factor +
        0.15 * (1.0 - lighting_score) +
        0.10 * (1.0 - footfall_proxy)
    )

    clamped_risk = min(1.0, max(0.0, risk))
    safety_score = round(100.0 * (1.0 - clamped_risk), 1)

    # Risk level classification
    if safety_score >= 75.0:
        level = "safe"
    elif safety_score >= 50.0:
        level = "caution"
    else:
        level = "danger"

    explanation = (
        f"Point safety score is {int(safety_score)}/100 ({level}). "
        f"Evaluated with {nearby_places_count} nearby commercial hubs and {round(density_accum, 1)} localized incident density."
    )

    return {
        "lat": lat,
        "lng": lng,
        "hour": hour,
        "safety_score": safety_score,
        "risk_score": round(clamped_risk, 3),
        "risk_level": level,
        "breakdown": {
            "incident_density": round(incident_density, 2),
            "severity_factor": round(severity_factor, 2),
            "time_of_day_factor": round(time_factor, 2),
            "lighting_score": round(lighting_score, 2),
            "footfall_proxy": round(footfall_proxy, 2),
        },
        "explanation": explanation,
    }
