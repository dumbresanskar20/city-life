import math
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from app.core.db import haversine_distance_m
from app.ml.safety_score import compute_safety_score_at_point


def densify_polyline(coords: List[List[float]], step_m: float = 50.0) -> List[List[float]]:
    """Densifies polyline coordinates so consecutive points are at most step_m meters apart."""
    if len(coords) < 2:
        return coords

    densified = [coords[0]]
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i + 1]
        dist = haversine_distance_m(p1[0], p1[1], p2[0], p2[1])

        if dist > step_m:
            steps = int(math.ceil(dist / step_m))
            for s in range(1, steps):
                frac = s / steps
                lat = p1[0] + frac * (p2[0] - p1[0])
                lng = p1[1] + frac * (p2[1] - p1[1])
                densified.append([round(lat, 6), round(lng, 6)])
        densified.append(p2)

    return densified


def generate_candidate_routes(
    origin: List[float],
    destination: List[float],
) -> List[Dict[str, any]]:
    """
    Generates 3 plausible route alternatives between origin and destination.
    Route 0: direct arterial corridor
    Route 1: eastern bypass (better lit, slightly longer)
    Route 2: western parkway
    """
    o_lat, o_lng = origin
    d_lat, d_lng = destination

    # Intermediate waypoints with spatial perturbations
    mid_lat = (o_lat + d_lat) / 2.0
    mid_lng = (o_lng + d_lng) / 2.0

    # Route A (Direct / Arterial)
    geom_a = [
        [o_lat, o_lng],
        [o_lat + (d_lat - o_lat) * 0.3, o_lng + (d_lng - o_lng) * 0.25],
        [mid_lat, mid_lng],
        [o_lat + (d_lat - o_lat) * 0.7, o_lng + (d_lng - o_lng) * 0.75],
        [d_lat, d_lng],
    ]

    # Route B (Slight loop / Lit Avenue)
    geom_b = [
        [o_lat, o_lng],
        [o_lat + (d_lat - o_lat) * 0.3 + 0.005, o_lng + (d_lng - o_lng) * 0.25 + 0.008],
        [mid_lat + 0.007, mid_lng + 0.010],
        [o_lat + (d_lat - o_lat) * 0.75 + 0.004, o_lng + (d_lng - o_lng) * 0.8 + 0.006],
        [d_lat, d_lng],
    ]

    # Route C (Outer Perimeter Parkway)
    geom_c = [
        [o_lat, o_lng],
        [o_lat + (d_lat - o_lat) * 0.25 - 0.006, o_lng + (d_lng - o_lng) * 0.2 - 0.009],
        [mid_lat - 0.008, mid_lng - 0.012],
        [o_lat + (d_lat - o_lat) * 0.7 - 0.005, o_lng + (d_lng - o_lng) * 0.75 - 0.008],
        [d_lat, d_lng],
    ]

    base_dist_km = haversine_distance_m(o_lat, o_lng, d_lat, d_lng) / 1000.0 * 1.35
    base_dist_km = max(1.5, round(base_dist_km, 2))

    return [
        {
            "id": "direct",
            "geometry": densify_polyline(geom_a, step_m=60.0),
            "distance_km": round(base_dist_km, 2),
            "duration_min": round(base_dist_km * 2.8, 1),
            "base_risk_bias": 1.15,  # Busier, more junctions
        },
        {
            "id": "avenue",
            "geometry": densify_polyline(geom_b, step_m=60.0),
            "distance_km": round(base_dist_km * 1.12, 2),
            "duration_min": round(base_dist_km * 1.12 * 2.9, 1),
            "base_risk_bias": 0.65,  # Well lit, fewer unlit spots
        },
        {
            "id": "parkway",
            "geometry": densify_polyline(geom_c, step_m=60.0),
            "distance_km": round(base_dist_km * 1.25, 2),
            "duration_min": round(base_dist_km * 1.25 * 3.1, 1),
            "base_risk_bias": 0.80,
        },
    ]


def evaluate_and_rank_routes(
    db: Session,
    origin: List[float],
    destination: List[float],
    hour: int = 14,
    priority: str = "balanced",
) -> Dict[str, any]:
    """
    Evaluates risk profile for each route and ranks Fastest, Safest, Balanced.
    """
    from app.models.incident import Incident
    from app.models.place import Place

    # Preload once to avoid hundreds of remote cloud database queries
    all_incidents = db.query(Incident).all()
    all_places = db.query(Place).all()

    candidates = generate_candidate_routes(origin, destination)
    scored_routes = []

    for c in candidates:
        geom = c["geometry"]
        risk_profile = []
        worst_risk = 0.0
        worst_point = geom[0]

        # Sample every 2nd point along geometry for risk profile
        for pt in geom[::2]:
            score_res = compute_safety_score_at_point(
                db,
                pt[0],
                pt[1],
                hour,
                incidents=all_incidents,
                places=all_places,
            )
            pt_risk = score_res["risk_score"] * c["base_risk_bias"]
            risk_profile.append(round(pt_risk * 100.0, 1))
            if pt_risk > worst_risk:
                worst_risk = pt_risk
                worst_point = pt

        avg_risk = sum(risk_profile) / max(1, len(risk_profile))
        # Total route risk combines average risk and penalty for worst stretch
        route_risk = round(min(100.0, 0.65 * avg_risk + 0.35 * (worst_risk * 100.0)), 1)

        scored_routes.append({
            "geometry": geom,
            "duration_min": c["duration_min"],
            "distance_km": c["distance_km"],
            "risk_score": route_risk,
            "risk_profile": risk_profile,
            "worst_segment": {
                "lat": worst_point[0],
                "lng": worst_point[1],
                "risk": round(worst_risk * 100.0, 1),
                "description": f"Near coordinate {worst_point[0]:.4f}, {worst_point[1]:.4f}",
            },
        })

    # Sort to determine fastest and safest
    fastest_route = min(scored_routes, key=lambda r: r["duration_min"])
    safest_route = min(scored_routes, key=lambda r: r["risk_score"])

    # Balanced route minimizes 0.5*norm_time + 0.5*norm_risk
    min_t = min(r["duration_min"] for r in scored_routes)
    max_t = max(r["duration_min"] for r in scored_routes) or 1.0
    min_r = min(r["risk_score"] for r in scored_routes)
    max_r = max(r["risk_score"] for r in scored_routes) or 1.0

    def balanced_score(r):
        norm_t = (r["duration_min"] - min_t) / (max_t - min_t + 0.001)
        norm_r = (r["risk_score"] - min_r) / (max_r - min_r + 0.001)
        return 0.5 * norm_t + 0.5 * norm_r

    balanced_route = min(scored_routes, key=balanced_score)

    results = []

    # 1. Fastest Route (Solid line, cyan)
    diff_min_f = round(fastest_route["duration_min"] - fastest_route["duration_min"], 1)
    results.append({
        "label": "Fastest",
        "color": "#38BDF8",
        "dash_pattern": "solid",
        "geometry": fastest_route["geometry"],
        "duration_min": fastest_route["duration_min"],
        "distance_km": fastest_route["distance_km"],
        "risk_score": fastest_route["risk_score"],
        "risk_profile": fastest_route["risk_profile"],
        "worst_segment": fastest_route["worst_segment"],
        "tradeoff_text": "Direct corridor via primary thoroughfare",
        "turn_by_turn": [
            {"instruction": "Depart origin heading towards central arterial", "distance_m": 450, "duration_s": 90},
            {"instruction": "Continue straight across main junction", "distance_m": 1200, "duration_s": 240},
            {"instruction": "Arrive at destination", "distance_m": 350, "duration_s": 70},
        ],
    })

    # 2. Safest Route (Dashed line, green)
    risk_diff_pct = round(max(0, (fastest_route["risk_score"] - safest_route["risk_score"]) / max(1, fastest_route["risk_score"])) * 100)
    time_extra_min = round(max(0, safest_route["duration_min"] - fastest_route["duration_min"]), 1)
    safest_tradeoff = f"+{time_extra_min} min, {risk_diff_pct}% lower risk" if time_extra_min > 0 else "Optimal route with lowest incident exposure"

    results.append({
        "label": "Safest",
        "color": "#22C55E",
        "dash_pattern": "dashed",
        "geometry": safest_route["geometry"],
        "duration_min": safest_route["duration_min"],
        "distance_km": safest_route["distance_km"],
        "risk_score": safest_route["risk_score"],
        "risk_profile": safest_route["risk_profile"],
        "worst_segment": safest_route["worst_segment"],
        "tradeoff_text": safest_tradeoff,
        "turn_by_turn": [
            {"instruction": "Depart via well-lit avenue", "distance_m": 600, "duration_s": 120},
            {"instruction": "Bypass high-density junction via outer ring", "distance_m": 1500, "duration_s": 300},
            {"instruction": "Turn gently towards destination", "distance_m": 500, "duration_s": 100},
        ],
    })

    # 3. Balanced Route (Dotted line, purple)
    bal_risk_diff = round(max(0, (fastest_route["risk_score"] - balanced_route["risk_score"]) / max(1, fastest_route["risk_score"])) * 100)
    bal_time_extra = round(max(0, balanced_route["duration_min"] - fastest_route["duration_min"]), 1)
    balanced_tradeoff = f"+{bal_time_extra} min, {bal_risk_diff}% lower risk" if bal_time_extra > 0 else "Best compromise between speed and safety"

    results.append({
        "label": "Balanced",
        "color": "#8B5CF6",
        "dash_pattern": "dotted",
        "geometry": balanced_route["geometry"],
        "duration_min": balanced_route["duration_min"],
        "distance_km": balanced_route["distance_km"],
        "risk_score": balanced_route["risk_score"],
        "risk_profile": balanced_route["risk_profile"],
        "worst_segment": balanced_route["worst_segment"],
        "tradeoff_text": balanced_tradeoff,
        "turn_by_turn": [
            {"instruction": "Take balanced connector road", "distance_m": 500, "duration_s": 100},
            {"instruction": "Follow illuminated commercial corridor", "distance_m": 1300, "duration_s": 260},
            {"instruction": "Arrive safely at destination", "distance_m": 400, "duration_s": 80},
        ],
    })

    return {
        "origin": origin,
        "destination": destination,
        "routes": results,
        "recommended_route": "Safest" if hour >= 20 or priority == "safest" else "Balanced",
    }
