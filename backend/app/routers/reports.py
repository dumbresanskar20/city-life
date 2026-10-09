from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.report import Report
from app.models.vote import ReportVote
from app.models.incident import Incident
from app.schemas.report import ReportOut, ReportVoteRequest, ReportVoteResponse
from app.ml.verification import verify_report, compute_wilson_lower_bound
from app.ml.vision import strip_exif_and_save
from app.ml.hotspots import compute_dbscan_hotspots

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=ReportOut)
async def submit_report(
    category: str = Form(...),
    description: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    transcript: Optional[str] = Form(None),
    session_id: str = Form("anon_user"),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if len(description.strip()) < 5:
        raise HTTPException(status_code=400, detail="Description must be at least 5 characters long.")

    photo_path = None
    photo_classification = None

    if photo and photo.filename:
        file_bytes = await photo.read()
        if len(file_bytes) > 8 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file exceeds max limit of 8MB.")
        photo_path, photo_classification = strip_exif_and_save(file_bytes, photo.filename)

    # Combine text and transcript if voice used
    full_description = f"{description} (Voice transcript: {transcript})" if transcript else description

    # Run verification pipeline
    verification = verify_report(
        db=db,
        category=category,
        description=full_description,
        lat=lat,
        lng=lng,
        photo_classification=photo_classification,
        session_id=session_id,
    )

    report = Report(
        user_session_id=session_id,
        category=category,
        description=full_description,
        lat=lat,
        lng=lng,
        photo_path=photo_path,
        transcript=transcript,
        detected_category=photo_classification[0] if photo_classification else category,
        severity=3,
        credibility_score=verification["credibility_score"],
        verification_status=verification["verification_status"],
        reasons=verification["reasons"],
        duplicate_of=verification["duplicate_of"],
        upvotes=1,
        downvotes=0,
        is_synthetic=False,
        created_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # If verified, promote to active incident & recompute hotspots
    if report.verification_status in ["ai_verified", "community"]:
        incident = Incident(
            source="report",
            category=report.category,
            severity=report.severity,
            lat=report.lat,
            lng=report.lng,
            occurred_at=report.created_at,
            weight=round(report.credibility_score / 100.0, 2),
            report_id=report.id,
            is_synthetic=False,
        )
        db.add(incident)
        db.commit()
        # Incremental hotspot update
        compute_dbscan_hotspots(db)

    return report


@router.get("", response_model=List[ReportOut])
def list_reports(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Report)
    if status:
        query = query.filter(Report.verification_status == status)
    if category:
        query = query.filter(Report.category == category)
    return query.order_by(Report.created_at.desc()).limit(limit).all()


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/vote", response_model=ReportVoteResponse)
def vote_report(
    report_id: int,
    req: ReportVoteRequest,
    session_id: str = Query("anon_session"),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    existing_vote = db.query(ReportVote).filter(
        ReportVote.report_id == report_id,
        ReportVote.session_id == session_id,
    ).first()

    if existing_vote:
        if existing_vote.value == req.value:
            # Cancel vote
            if req.value == 1:
                report.upvotes = max(0, report.upvotes - 1)
            else:
                report.downvotes = max(0, report.downvotes - 1)
            db.delete(existing_vote)
        else:
            # Change vote
            if req.value == 1:
                report.upvotes += 1
                report.downvotes = max(0, report.downvotes - 1)
            else:
                report.downvotes += 1
                report.upvotes = max(0, report.upvotes - 1)
            existing_vote.value = req.value
    else:
        # New vote
        vote = ReportVote(report_id=report_id, session_id=session_id, value=req.value)
        db.add(vote)
        if req.value == 1:
            report.upvotes += 1
        else:
            report.downvotes += 1

    # Re-evaluate credibility using Wilson lower bound
    wilson_ratio = compute_wilson_lower_bound(report.upvotes, report.downvotes)
    report.credibility_score = round(min(100.0, max(20.0, 0.6 * report.credibility_score + 0.4 * (wilson_ratio * 100.0))), 1)

    if report.credibility_score >= 75.0:
        report.verification_status = "ai_verified"
    elif report.credibility_score >= 50.0:
        report.verification_status = "community"

    db.commit()
    db.refresh(report)

    return ReportVoteResponse(
        report_id=report.id,
        upvotes=report.upvotes,
        downvotes=report.downvotes,
        credibility_score=report.credibility_score,
        verification_status=report.verification_status,
        reasons=report.reasons or [],
    )
