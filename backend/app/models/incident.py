from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(String(32), nullable=False, default="synthetic")  # report, official, synthetic
    category = Column(String(64), nullable=False, index=True)
    severity = Column(Integer, nullable=False, default=3)  # 1-5
    lat = Column(Float, nullable=False, index=True)
    lng = Column(Float, nullable=False, index=True)
    occurred_at = Column(DateTime, default=datetime.utcnow, index=True)
    weight = Column(Float, default=1.0)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="SET NULL"), nullable=True)
    is_synthetic = Column(Boolean, default=False)

    report = relationship("Report", backref="incidents")

    __table_args__ = (
        Index("idx_incidents_lat_lng", "lat", "lng"),
        Index("idx_incidents_time_cat", "occurred_at", "category"),
    )
