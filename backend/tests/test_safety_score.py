import pytest
from app.core.db import SessionLocal
from app.ml.safety_score import compute_safety_score_at_point


def test_safety_score_monotonicity_and_bounds():
    db = SessionLocal()
    try:
        # Evaluate day vs night for same coordinate
        day_res = compute_safety_score_at_point(db, lat=18.5204, lng=73.8567, hour=12)
        night_res = compute_safety_score_at_point(db, lat=18.5204, lng=73.8567, hour=23)

        # Bounds check 0 - 100
        assert 0 <= day_res["safety_score"] <= 100
        assert 0 <= night_res["safety_score"] <= 100

        # Monotonicity: night risk must be >= day risk (day safety >= night safety)
        assert day_res["safety_score"] >= night_res["safety_score"]

        # Breakdown factors must be present
        for factor in ["incident_density", "severity_factor", "time_of_day_factor", "lighting_score", "footfall_proxy"]:
            assert factor in day_res["breakdown"]
    finally:
        db.close()
