from datetime import datetime
from sqlalchemy import Column, Integer, String, SmallInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base


class ReportVote(Base):
    __tablename__ = "report_votes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(128), nullable=False, index=True)
    value = Column(SmallInteger, nullable=False)  # +1 or -1
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", backref="votes")

    __table_args__ = (
        UniqueConstraint("report_id", "session_id", name="uq_report_session_vote"),
    )
