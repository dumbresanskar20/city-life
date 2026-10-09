import sys
from typing import List, Optional
from pydantic import ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: str = "development"
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "sqlite:///./citycompass.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            v_clean = v.strip()
            if v_clean.startswith("postgres://"):
                return "postgresql+psycopg2://" + v_clean[len("postgres://"):]
            if v_clean.startswith("postgresql://") and not v_clean.startswith("postgresql+"):
                return "postgresql+psycopg2://" + v_clean[len("postgresql://"):]
        return v

    CITY_NAME: str = "Pune"
    CITY_LAT: float = 18.5204
    CITY_LNG: float = 73.8567
    CITY_BBOX: str = "18.44,73.75,18.62,73.96"

    USE_MOCKS: bool = True
    ORS_API_KEY: Optional[str] = None
    OPENWEATHER_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 8
    RATE_LIMIT_PER_MIN: int = 60
    WHISPER_MODEL: str = "base"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def parsed_bbox(self) -> tuple[float, float, float, float]:
        parts = [float(p.strip()) for p in self.CITY_BBOX.split(",")]
        if len(parts) != 4:
            raise ValueError(f"CITY_BBOX must contain 4 comma-separated floats (south,west,north,east), got: '{self.CITY_BBOX}'")
        return (parts[0], parts[1], parts[2], parts[3])


def load_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as e:
        sys.stderr.write("\n" + "=" * 60 + "\n")
        sys.stderr.write("CONFIGURATION ERROR: Failed to load CityCompass settings.\n")
        sys.stderr.write("=" * 60 + "\n\n")
        for err in e.errors():
            loc = ".".join(str(x) for x in err["loc"])
            msg = err["msg"]
            sys.stderr.write(f"  * Missing/Invalid variable: {loc}\n")
            sys.stderr.write(f"    Issue: {msg}\n")
            sys.stderr.write(f"    Fix: Set '{loc}' in backend/.env or your environment variables.\n\n")
        sys.stderr.write("Please inspect backend/.env.example for a reference configuration.\n")
        sys.stderr.write("=" * 60 + "\n\n")
        sys.exit(1)


settings = load_settings()
