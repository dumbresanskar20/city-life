from datetime import datetime
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.insights import WeatherResponse, TrafficResponse, AlertsResponse, AlertItem

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/weather", response_model=WeatherResponse)
def get_weather():
    now = datetime.utcnow()
    # Realistic weather model for Pune
    hour = now.hour
    is_day = 6 <= hour <= 18
    temp = 28.5 if is_day else 21.0

    return WeatherResponse(
        city=settings.CITY_NAME,
        temperature_c=temp,
        condition="Partly Cloudy" if is_day else "Clear Skies",
        humidity_percent=54,
        wind_speed_kmh=12.5,
        rain_past_48h_mm=0.0,
        icon="cloud-sun" if is_day else "moon",
        updated_at=now,
    )


@router.get("/traffic", response_model=TrafficResponse)
def get_traffic():
    hour = datetime.utcnow().hour
    is_rush_hour = (8 <= hour <= 11) or (17 <= hour <= 20)

    congestion_score = 75.0 if is_rush_hour else 35.0
    level = "heavy" if is_rush_hour else "moderate" if 11 < hour < 17 else "low"
    speed = 22.0 if is_rush_hour else 42.0

    return TrafficResponse(
        congestion_level=level,
        congestion_score=congestion_score,
        average_speed_kmh=speed,
        peak_factor=1.4 if is_rush_hour else 1.0,
        time_of_day="Rush Hour" if is_rush_hour else "Off-Peak",
    )


@router.get("/alerts", response_model=AlertsResponse)
def get_alerts():
    now = datetime.utcnow()
    return AlertsResponse(
        alerts=[
            AlertItem(
                id="alert-1",
                severity="caution",
                title="Metro Extension Work near Swargate",
                description="Traffic lane restrictions in effect. Diversions active via Tilak Road.",
                issued_at=now,
                category="traffic",
            ),
            AlertItem(
                id="alert-2",
                severity="info",
                title="Monsoon Drainage Clearance Verified",
                description="Municipal storm drain clearing completed along FC Road corridor.",
                issued_at=now,
                category="civic",
            ),
        ]
    )
