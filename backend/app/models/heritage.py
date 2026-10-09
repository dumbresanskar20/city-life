from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class HeritageSite(Base):
    __tablename__ = "heritage_sites"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    era = Column(String(100), nullable=False)
    summary = Column(Text, nullable=False)
    significance = Column(Text, nullable=False)
    visiting_hours = Column(String(100), default="09:00 - 18:00")
    entry_fee = Column(String(100), default="₹25 (Domestic) / ₹300 (Foreign)")
    traditions = Column(JSON, default=list)
    wikidata_id = Column(String(32), nullable=True)
    story_cache = Column(Text, nullable=True)

    place = relationship("Place", backref="heritage_site")
