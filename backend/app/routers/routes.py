from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.route import RouteRequest, RouteResponse
from app.ml.route_ranker import evaluate_and_rank_routes

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.post("/safe", response_model=RouteResponse)
def compute_safe_route(req: RouteRequest, db: Session = Depends(get_db)):
    result = evaluate_and_rank_routes(
        db=db,
        origin=req.origin,
        destination=req.destination,
        hour=req.hour,
        priority=req.priority,
    )
    return result
