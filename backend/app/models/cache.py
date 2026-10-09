from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from app.models.base import Base


class RouteCache(Base):
    __tablename__ = "route_cache"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hash = Column(String(64), unique=True, index=True, nullable=False)
    response = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    city_name = Column(String(100), unique=True, index=True, nullable=False)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LLMCache(Base):
    __tablename__ = "llm_cache"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prompt_hash = Column(String(64), unique=True, index=True, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
