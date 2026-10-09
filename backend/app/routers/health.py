from fastapi import APIRouter
from app.core.config import settings
from app.core.db import check_database_connection
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    is_connected, is_postgis, message = check_database_connection()

    integrations = {
        "overpass": "mock" if settings.USE_MOCKS or not settings.CITY_BBOX else "live",
        "openrouteservice": "mock" if settings.USE_MOCKS or not settings.ORS_API_KEY else "live",
        "openweather": "mock" if settings.USE_MOCKS or not settings.OPENWEATHER_API_KEY else "live",
        "wikipedia": "mock" if settings.USE_MOCKS else "live",
        "anthropic_claude": "mock" if settings.USE_MOCKS or not settings.ANTHROPIC_API_KEY else "live",
    }

    models = {
        "credibility_verifier": "ready",
        "dbscan_hotspots": "ready",
        "safety_score_engine": "ready",
        "safe_route_ranker": "ready",
        "nlp_zero_shot": "ready",
        "vision_classifier": "ready",
        "speech_transcription": "ready",
    }

    return HealthResponse(
        status="ok" if is_connected else "degraded",
        city=settings.CITY_NAME,
        db_connected=is_connected,
        postgis_available=is_postgis,
        integrations=integrations,
        models=models,
    )
