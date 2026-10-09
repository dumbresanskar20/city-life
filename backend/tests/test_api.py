import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["city"] == "Pune"
    assert data["db_connected"] is True

def test_places_list():
    response = client.get("/places")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert "name" in first
    assert "lat" in first
    assert "safety_score" in first

def test_reports_list():
    response = client.get("/reports?limit=10")
    assert response.status_code == 200
    reports = response.json()
    assert isinstance(reports, list)
    assert len(reports) > 0

def test_safe_routes_endpoint():
    payload = {
        "origin": [18.5204, 73.8567],
        "destination": [18.5300, 73.8400],
        "hour": 22,
        "priority": "balanced"
    }
    response = client.post("/routes/safe", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "routes" in data
    assert len(data["routes"]) >= 2
    for r in data["routes"]:
        assert "label" in r
        assert "risk_score" in r
        assert "geometry" in r
