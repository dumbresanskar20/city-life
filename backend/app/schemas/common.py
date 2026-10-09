from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    cursor: Optional[int] = None
    has_more: bool = False


class HealthResponse(BaseModel):
    status: str
    city: str
    db_connected: bool
    postgis_available: bool
    integrations: dict[str, str]
    models: dict[str, str]
