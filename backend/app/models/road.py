from sqlalchemy import Column, Integer, String, Boolean, JSON
from app.models.base import Base


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    osm_id = Column(String(64), nullable=True, index=True)
    geometry = Column(JSON, nullable=False)  # [[lat, lng], [lat, lng], ...]
    has_lighting = Column(Boolean, default=False)
    highway_type = Column(String(64), default="residential")
    nearby_open_places = Column(Integer, default=0)
