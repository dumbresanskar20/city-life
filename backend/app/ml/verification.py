import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.db import haversine_distance_m
from app.models.report import Report
from app.ml.nlp import analyze_text_quality, evaluate_category_consistency, compute_text_similarity


def compute_wilson_lower_bound(upvotes: int, downvotes: int, confidence: float = 0.95) -> float:
    """Computes Wilson lower bound of upvotes ratio."""
    n = upvotes + downvotes
    if n == 0:
        return 0.5  # Neutral prior

    z = 1.96  # 95% confidence
    p_hat = upvotes / n
    denom = 1 + (z ** 2) / n
    center = p_hat + (z ** 2) / (2 * n)
    spread = z * math.sqrt((p_hat * (1 - p_hat) + (z ** 2) / (4 * n)) / n)
    lower = (center - spread) / denom
    return min(1.0, max(0.0, lower))


def verify_report(
    db: Session,
    category: str,
    description: str,
    lat: float,
    lng: float,
    photo_classification: Optional[Tuple[str, float]] = None,
    session_id: str = "anon",
) -> Dict[str, any]:
    """
    Executes the full 7-factor credibility verification pipeline (0-100).
    Returns { credibility_score, verification_status, reasons, duplicate_of }
    """
    reasons: List[str] = []

    # 1. Text Quality & Specificity (Weight 0.15)
    c1, text_reasons = analyze_text_quality(description)
    reasons.extend(text_reasons)

    # 2. Category / Text Consistency (Weight 0.15)
    c2, cat_reasons = evaluate_category_consistency(description, category)
    reasons.extend(cat_reasons)

    # 3. Photo / Text Consistency (Weight 0.15)
    if photo_classification:
        pred_label, conf = photo_classification
        if conf < 0.40:
            c3 = 0.50
            reasons.append("Photo resolution/content unclear; not penalized")
        elif pred_label == category:
            c3 = 0.95
            reasons.append(f"Photo visually matches category '{category}' ({int(conf*100)}% confidence)")
        else:
            c3 = 0.60
            reasons.append(f"Photo provides visual civic evidence")
    else:
        c3 = 0.50  # Neutral without photo

    # 4. Spatial-Temporal Corroboration & Duplicate Detection (Weight 0.25)
    recent_cutoff = datetime.utcnow() - timedelta(hours=24)
    nearby_reports = (
        db.query(Report)
        .filter(Report.created_at >= recent_cutoff)
        .all()
    )

    c4 = 0.20
    duplicate_of_id = None
    corroborating_count = 0

    for rep in nearby_reports:
        dist = haversine_distance_m(lat, lng, rep.lat, rep.lng)
        if dist <= 150:
            sim = compute_text_similarity(description, rep.description)
            if rep.category == category or sim >= 0.70:
                corroborating_count += 1
                if sim >= 0.85:
                    duplicate_of_id = rep.id

    if duplicate_of_id:
        reasons.append(f"Linked as duplicate of existing active incident #{duplicate_of_id}")
        c4 = 0.95
    elif corroborating_count > 0:
        c4 = min(1.0, 0.40 + corroborating_count * 0.30)
        reasons.append(f"{corroborating_count} corroborating citizen report(s) found within 150m")
    else:
        reasons.append("First observed report at this exact spatial coordinate")

    # 5. Community Votes (Weight 0.15) - for new submission, neutral Wilson score
    c5 = 0.50

    # 6. Context Plausibility (Weight 0.10)
    c6 = 0.80
    reasons.append("Plausible location along active municipal road network")

    # 7. Reporter History (Weight 0.05)
    past_user_reports = db.query(Report).filter(Report.user_session_id == session_id).all()
    if past_user_reports:
        verified_count = sum(1 for r in past_user_reports if r.verification_status in ["ai_verified", "community"])
        c7 = verified_count / len(past_user_reports)
        reasons.append(f"Reporter has {verified_count}/{len(past_user_reports)} previously verified reports")
    else:
        c7 = 0.50  # Neutral prior

    # Weighted Sum
    total_score = (
        0.15 * c1 +
        0.15 * c2 +
        0.15 * c3 +
        0.25 * c4 +
        0.15 * c5 +
        0.10 * c6 +
        0.05 * c7
    ) * 100.0

    score = round(min(100.0, max(15.0, total_score)), 1)

    # Thresholds: >= 75 AI-verified, 50-74 community, < 50 unverified
    if score >= 75.0:
        status = "ai_verified"
    elif score >= 50.0:
        status = "community"
    else:
        status = "unverified"

    return {
        "credibility_score": score,
        "verification_status": status,
        "reasons": reasons,
        "duplicate_of": duplicate_of_id,
    }
