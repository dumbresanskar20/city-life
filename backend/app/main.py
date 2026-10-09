from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.db import check_database_connection
from app.core.errors import (
    CityCompassException,
    citycompass_exception_handler,
    generic_http_exception_handler,
    unhandled_exception_handler,
)
from app.routers import health, places, reports, safety, routes, compare, heritage, insights, analytics

setup_logging()

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MIN}/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    logger.info("Initializing CityCompass backend", env=settings.APP_ENV, city=settings.CITY_NAME)
    is_connected, is_postgis, msg = check_database_connection()
    if not is_connected:
        logger.error("Database connection failure at startup!", detail=msg)
    else:
        logger.info("Database online", detail=msg, postgis=is_postgis)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    logger.info("Shutting down CityCompass backend")


app = FastAPI(
    title="CityCompass API",
    description="Your city, verified. Smart city exploration platform converting urban data into verified, actionable insights.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# State & Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(CityCompassException, citycompass_exception_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Core Routers
app.include_router(health.router)
app.include_router(places.router)
app.include_router(reports.router)
app.include_router(safety.router)
app.include_router(routes.router)
app.include_router(compare.router)
app.include_router(heritage.router)
app.include_router(insights.router)
app.include_router(analytics.router)
