from typing import List, Optional
from pydantic import BaseModel
from app.schemas.place import PlaceOut


class HeritageOut(BaseModel):
    id: int
    place_id: int
    era: str
    summary: str
    significance: str
    visiting_hours: str
    entry_fee: str
    traditions: List[str]
    wikidata_id: Optional[str] = None
    place: Optional[PlaceOut] = None

    class Config:
        from_attributes = True


class HeritageStoryResponse(BaseModel):
    id: int
    name: str
    era: str
    story: str
