from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class WeatherResponse(BaseModel):
    city: str
    temperature_c: float
    condition: str
    humidity_percent: int
    wind_speed_kmh: float
    rain_past_48h_mm: float
    icon: str
    updated_at: datetime


class TrafficResponse(BaseModel):
    congestion_level: str  # low, moderate, heavy, severe
    congestion_score: float  # 0 to 100
    average_speed_kmh: float
    peak_factor: float
    time_of_day: str


class AlertItem(BaseModel):
    id: str
    severity: str  # info, caution, danger
    title: str
    description: str
    issued_at: datetime
    category: str


class AlertsResponse(BaseModel):
    alerts: List[AlertItem]
