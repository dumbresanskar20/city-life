import math
import sys
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

# Configure engine depending on database flavor
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
except Exception as e:
    sys.stderr.write("\n" + "=" * 60 + "\n")
    sys.stderr.write("DATABASE CONNECTION ERROR: Cannot initialize DB engine.\n")
    sys.stderr.write(f"Configured DATABASE_URL: {settings.DATABASE_URL}\n")
    sys.stderr.write(f"Details: {str(e)}\n")
    sys.stderr.write("Fix: Check DATABASE_URL in backend/.env or verify your Postgres server.\n")
    sys.stderr.write("=" * 60 + "\n\n")
    sys.exit(1)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_is_postgis_available = False


def check_database_connection() -> tuple[bool, bool, str]:
    """
    Validates database connectivity and tests PostGIS extension availability.
    Returns: (is_connected, is_postgis_available, message)
    """
    global _is_postgis_available
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            # Check PostGIS if not SQLite
            if not settings.DATABASE_URL.startswith("sqlite"):
                try:
                    result = conn.execute(text("SELECT PostGIS_Version();")).fetchone()
                    if result:
                        _is_postgis_available = True
                        return (True, True, f"PostgreSQL connected with PostGIS {result[0]}")
                except Exception:
                    logger.warning("PostGIS extension is not installed or enabled. Falling back to Python Haversine.")
                    _is_postgis_available = False
                    return (True, False, "PostgreSQL connected (PostGIS not detected; Haversine fallback active)")
            else:
                _is_postgis_available = False
                return (True, False, "SQLite connected (Haversine spatial fallback active)")
    except Exception as e:
        logger.error("Database connection check failed", error=str(e))
        return (False, False, f"Connection failed: {str(e)}")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in meters using Haversine formula."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c
