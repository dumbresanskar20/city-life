from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Index
from app.models.base import Base


class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    centroid_lat = Column(Float, nullable=False)
    centroid_lng = Column(Float, nullable=False)
    radius_m = Column(Float, default=150.0)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    incident_count = Column(Integer, default=0)
    time_bucket = Column(String(32), nullable=False, index=True)  # morning, afternoon, evening, night
    computed_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_hotspots_bucket_risk", "time_bucket", "risk_score"),
    )
