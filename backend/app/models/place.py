from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Index
from app.models.base import Base


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    osm_id = Column(String(64), index=True, nullable=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)  # food, hotel, attraction, heritage, transport, other
    subcategory = Column(String(64), nullable=True)
    lat = Column(Float, nullable=False, index=True)
    lng = Column(Float, nullable=False, index=True)
    address = Column(String(500), nullable=True)
    price_level = Column(Integer, default=2)  # 1-4
    rating = Column(Float, default=4.0)
    rating_count = Column(Integer, default=0)
    opening_hours = Column(JSON, default=dict)
    tags = Column(JSON, default=list)
    accessibility = Column(JSON, default=dict)
    cleanliness_score = Column(Float, default=70.0)
    safety_score = Column(Float, default=75.0)
    affordability_score = Column(Float, default=65.0)
    accessibility_score = Column(Float, default=70.0)
    overall_score = Column(Float, default=72.0)
    photo_url = Column(String(500), nullable=True)
    source = Column(String(64), default="osm")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_places_lat_lng", "lat", "lng"),
        Index("idx_places_category_rating", "category", "rating"),
    )
