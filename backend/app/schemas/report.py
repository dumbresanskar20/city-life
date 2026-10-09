from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    category: str
    description: str = Field(min_length=5, max_length=1500)
    lat: float
    lng: float
    transcript: Optional[str] = None


class ReportOut(BaseModel):
    id: int
    user_session_id: str
    category: str
    description: str
    lat: float
    lng: float
    photo_path: Optional[str] = None
    audio_path: Optional[str] = None
    transcript: Optional[str] = None
    detected_category: Optional[str] = None
    sentiment: float = 0.0
    severity: int = 3
    credibility_score: float = 50.0
    verification_status: str = "unverified"
    reasons: List[str] = Field(default_factory=list)
    duplicate_of: Optional[int] = None
    upvotes: int = 0
    downvotes: int = 0
    is_synthetic: bool = False
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportVoteRequest(BaseModel):
    value: int = Field(..., ge=-1, le=1)


class ReportVoteResponse(BaseModel):
    report_id: int
    upvotes: int
    downvotes: int
    credibility_score: float
    verification_status: str
    reasons: List[str]
