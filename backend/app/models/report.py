from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, JSON, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.models.base import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_session_id = Column(String(128), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)  # pothole, garbage, broken_light, accident, harassment, waterlogging, traffic, other
    description = Column(Text, nullable=False)
    lat = Column(Float, nullable=False, index=True)
    lng = Column(Float, nullable=False, index=True)
    photo_path = Column(String(500), nullable=True)
    audio_path = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    detected_category = Column(String(64), nullable=True)
    sentiment = Column(Float, default=0.0)  # -1.0 to 1.0
    severity = Column(Integer, default=3)  # 1 to 5
    credibility_score = Column(Float, default=50.0)  # 0 to 100
    verification_status = Column(String(32), default="unverified", index=True)  # unverified, community, ai_verified, official
    reasons = Column(JSON, default=list)
    duplicate_of = Column(Integer, ForeignKey("reports.id", ondelete="SET NULL"), nullable=True)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)

    duplicates = relationship("Report", remote_side=[id])

    __table_args__ = (
        Index("idx_reports_lat_lng", "lat", "lng"),
        Index("idx_reports_category_status", "category", "verification_status"),
        Index("idx_reports_created_status", "created_at", "verification_status"),
    )
