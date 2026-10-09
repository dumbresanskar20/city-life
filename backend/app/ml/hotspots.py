import math
from datetime import datetime
import numpy as np
from sklearn.cluster import DBSCAN
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.incident import Incident
from app.models.hotspot import Hotspot


TIME_BUCKETS = {
    "morning": (6, 12),
    "afternoon": (12, 17),
    "evening": (17, 21),
    "night": (21, 6),
}


def get_time_bucket(dt: datetime) -> str:
    hour = dt.hour
    if 6 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def compute_dbscan_hotspots(db: Session) -> int:
    """
    Computes DBSCAN spatial clusters of verified incidents partitioned by time bucket.
    Eps = 150m (~0.00015 km in radians: 0.15 / 6371.0)
    Min samples = 3
    """
    # Clear old hotspots
    db.query(Hotspot).delete()
    db.commit()

    incidents = db.query(Incident).all()
    if not incidents:
        return 0

    now = datetime.utcnow()
    total_created = 0

    # Earth radius in kilometers
    kms_per_radian = 6371.0088
    eps_rad = 0.15 / kms_per_radian  # 150m in radians

    for bucket, (start_h, end_h) in TIME_BUCKETS.items():
        bucket_incidents = []
        for inc in incidents:
            if get_time_bucket(inc.occurred_at) == bucket:
                bucket_incidents.append(inc)

        if len(bucket_incidents) < 3:
            continue

        coords_deg = np.array([[inc.lat, inc.lng] for inc in bucket_incidents])
        coords_rad = np.radians(coords_deg)

        dbscan = DBSCAN(eps=eps_rad, min_samples=3, metric="haversine")
        labels = dbscan.fit_predict(coords_rad)

        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:
                continue  # Noise points

            cluster_mask = labels == label
            cluster_incidents = [bucket_incidents[idx] for idx in range(len(labels)) if cluster_mask[idx]]

            # Centroid
            cluster_lats = [inc.lat for inc in cluster_incidents]
            cluster_lngs = [inc.lng for inc in cluster_incidents]
            centroid_lat = float(np.mean(cluster_lats))
            centroid_lng = float(np.mean(cluster_lngs))

            # Risk = sum(severity * recency_decay * credibility)
            total_risk = 0.0
            for inc in cluster_incidents:
                age_days = (now - inc.occurred_at).total_seconds() / 86400.0
                recency_decay = math.exp(-max(0.0, age_days) / 45.0)
                credibility = inc.weight if inc.weight else 0.8
                total_risk += inc.severity * recency_decay * credibility

            # Normalize risk score to 0 - 100 scale
            normalized_risk = min(100.0, max(10.0, total_risk * 8.5))

            hotspot = Hotspot(
                centroid_lat=round(centroid_lat, 6),
                centroid_lng=round(centroid_lng, 6),
                radius_m=150.0,
                risk_score=round(normalized_risk, 1),
                incident_count=len(cluster_incidents),
                time_bucket=bucket,
                computed_at=now,
            )
            db.add(hotspot)
            total_created += 1

    db.commit()
    logger.info("DBSCAN hotspots generated", total=total_created)
    return total_created
