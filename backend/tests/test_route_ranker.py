import pytest
from app.core.db import SessionLocal
from app.ml.route_ranker import evaluate_and_rank_routes, densify_polyline


def test_densify_polyline():
    coords = [[18.52, 73.85], [18.54, 73.87]]
    densified = densify_polyline(coords, step_m=50.0)
    assert len(densified) > len(coords)


def test_route_ranking_tradeoffs():
    db = SessionLocal()
    try:
        origin = [18.5362, 73.8885]
        destination = [18.5222, 73.8407]
        result = evaluate_and_rank_routes(db, origin, destination, hour=22)

        routes = result["routes"]
        assert len(routes) == 3

        labels = [r["label"] for r in routes]
        assert "Fastest" in labels
        assert "Safest" in labels
        assert "Balanced" in labels

        fastest = next(r for r in routes if r["label"] == "Fastest")
        safest = next(r for r in routes if r["label"] == "Safest")

        # Tradeoff check: Fastest duration must be <= Safest duration
        assert fastest["duration_min"] <= safest["duration_min"]
        # Safest risk must be <= Fastest risk
        assert safest["risk_score"] <= fastest["risk_score"]

        # Tradeoff text verification
        assert isinstance(safest["tradeoff_text"], str)
        assert len(safest["tradeoff_text"]) > 0
    finally:
        db.close()
