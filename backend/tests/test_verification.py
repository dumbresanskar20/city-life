import pytest
from app.core.db import SessionLocal
from app.ml.verification import compute_wilson_lower_bound, verify_report

def test_wilson_score_bounds():
    # 0 upvotes, 0 downvotes should return neutral 0.5
    assert compute_wilson_lower_bound(0, 0) == 0.5
    # High upvotes should have high lower bound
    high_score = compute_wilson_lower_bound(100, 2)
    assert high_score > 0.8
    # High downvotes should have low lower bound
    low_score = compute_wilson_lower_bound(2, 100)
    assert low_score < 0.2

def test_verify_report_pipeline():
    db = SessionLocal()
    try:
        # Detailed report with specific keywords
        res = verify_report(
            db=db,
            category="pothole",
            description="Deep hazardous pothole near FC college road bus stop causing motorcycle accidents",
            lat=18.5204,
            lng=73.8567,
            photo_classification=("pothole", 0.92),
            session_id="test_session"
        )
        assert res["credibility_score"] >= 50.0
        assert res["verification_status"] in ["ai_verified", "community", "unverified"]
        assert len(res["reasons"]) > 0
    finally:
        db.close()

