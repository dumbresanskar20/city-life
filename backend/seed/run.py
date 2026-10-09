import json
import os
import random
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.db import SessionLocal, engine, Base
from app.core.logging import logger, setup_logging
from app.models.place import Place
from app.models.heritage import HeritageSite
from app.models.report import Report
from app.models.incident import Incident
from app.models.hotspot import Hotspot
from app.models.road import RoadSegment
from app.integrations.overpass import OverpassClient
from app.ml.hotspots import compute_dbscan_hotspots

setup_logging()

# Focal coordinates in Pune for realistic hotspots
JUNCTIONS = [
    {"name": "Swargate Junction", "lat": 18.5018, "lng": 73.8586, "risk_bias": 0.85, "categories": ["traffic", "accident", "waterlogging"]},
    {"name": "Pune Station Outer", "lat": 18.5284, "lng": 73.8744, "risk_bias": 0.75, "categories": ["harassment", "broken_light", "garbage"]},
    {"name": "Shivajinagar Underpass", "lat": 18.5312, "lng": 73.8445, "risk_bias": 0.80, "categories": ["waterlogging", "pothole", "traffic"]},
    {"name": "Hadapsar Gadital", "lat": 18.5023, "lng": 73.9281, "risk_bias": 0.70, "categories": ["pothole", "traffic", "broken_light"]},
    {"name": "Chandani Chowk Curve", "lat": 18.5074, "lng": 73.7845, "risk_bias": 0.65, "categories": ["accident", "pothole"]},
    {"name": "Koregaon Park North Main", "lat": 18.5362, "lng": 73.8885, "risk_bias": 0.30, "categories": ["garbage", "traffic"]},
    {"name": "FC Road Corridor", "lat": 18.5222, "lng": 73.8407, "risk_bias": 0.35, "categories": ["traffic", "garbage"]},
]

REPORT_DESCRIPTIONS = {
    "pothole": [
        "Deep pothole right in the middle lane near the turn, severe hazard for two-wheelers.",
        "Large cavity on the road asphalt following last week's drainage repair. Traffic slowing down.",
        "Cluster of multiple potholes near the signal causing vehicles to swerve dangerously.",
        "Unmarked crater in the left lane, already saw a scooter lose balance.",
    ],
    "broken_light": [
        "Streetlight cluster completely dark for the past 4 days, pitch black corridor after 8 PM.",
        "Sodium vapor lamp blinking continuously, dark blind spot at the pedestrian crossing.",
        "Faulty pole wiring and no illumination on this 150m stretch of residential road.",
        "Dark alley stretch with non-functional municipal light fixtures.",
    ],
    "waterlogging": [
        "Severe water accumulation up to knee level under the railway underpass.",
        "Clogged storm drains causing localized flooding across both lanes.",
        "Water stagnating for 3 days attracting mosquitoes and blocking sidewalk access.",
    ],
    "accident": [
        "Two-wheeler collision at the blind junction, emergency assistance already attended.",
        "Auto-rickshaw and bike fender bender causing massive tailback on the approach road.",
        "Skid incident due to loose gravel on the curve.",
    ],
    "harassment": [
        "Group loitering near unlit bus stop making inappropriate comments to commuters.",
        "Unsafe isolated stretch after 9 PM, no police patrol visible.",
        "Suspicious individuals following pedestrians along the dimly lit service road.",
    ],
    "garbage": [
        "Overflowing waste container spilling onto the pedestrian walkway.",
        "Construction debris dumped by the roadside obstructing the cycle track.",
        "Illegal garbage burning producing thick smoke near the residential gate.",
    ],
    "traffic": [
        "Stalled bus at the bottle-neck causing gridlock across three signal phases.",
        "Severe bumper-to-bumper congestion due to unauthorized double parking.",
        "Traffic signal malfunctioning, displaying flashing amber creating chaos.",
    ],
}


def run_seed():
    logger.info("Starting CityCompass database seeding...")
    db = SessionLocal()

    try:
        # Clear existing synthetic demo data
        db.query(Incident).filter(Incident.is_synthetic == True).delete()
        db.query(Report).filter(Report.is_synthetic == True).delete()
        db.query(Hotspot).delete()
        db.commit()

        # 1. Ingest Places
        client = OverpassClient()
        fallback_data = client._load_fallback_fixtures()
        places_data = fallback_data.get("places", [])

        existing_place_names = {p.name for p in db.query(Place).all()}
        inserted_places = {}

        for p_data in places_data:
            name = p_data["name"]
            if name not in existing_place_names:
                place = Place(
                    name=name,
                    category=p_data["category"],
                    subcategory=p_data.get("subcategory"),
                    lat=p_data["lat"],
                    lng=p_data["lng"],
                    address=p_data.get("address"),
                    price_level=p_data.get("price_level", 2),
                    rating=p_data.get("rating", 4.3),
                    rating_count=p_data.get("rating_count", 150),
                    opening_hours=p_data.get("opening_hours", {}),
                    tags=p_data.get("tags", []),
                    accessibility=p_data.get("accessibility", {}),
                    cleanliness_score=p_data.get("cleanliness_score", 75.0),
                    safety_score=p_data.get("safety_score", 80.0),
                    affordability_score=p_data.get("affordability_score", 70.0),
                    accessibility_score=p_data.get("accessibility_score", 75.0),
                    overall_score=p_data.get("overall_score", 76.0),
                    photo_url=p_data.get("photo_url"),
                    source=p_data.get("source", "osm"),
                )
                db.add(place)
                db.flush()
                inserted_places[name] = place
            else:
                inserted_places[name] = db.query(Place).filter(Place.name == name).first()

        db.commit()
        logger.info("Places ingested", total_places=db.query(Place).count())

        # 2. Ingest Heritage Sites
        curr_dir = os.path.dirname(__file__)
        heritage_fixture_path = os.path.join(curr_dir, "fixtures", "heritage_pune_fallback.json")
        if os.path.exists(heritage_fixture_path):
            with open(heritage_fixture_path, "r", encoding="utf-8") as f:
                heritage_data = json.load(f)

            for h_item in heritage_data:
                place_name = h_item["place_name"]
                place = inserted_places.get(place_name)
                if place:
                    existing_h = db.query(HeritageSite).filter(HeritageSite.place_id == place.id).first()
                    if not existing_h:
                        h_site = HeritageSite(
                            place_id=place.id,
                            era=h_item["era"],
                            summary=h_item["summary"],
                            significance=h_item["significance"],
                            visiting_hours=h_item.get("visiting_hours", "09:00 - 18:00"),
                            entry_fee=h_item.get("entry_fee", "₹25"),
                            traditions=h_item.get("traditions", []),
                            wikidata_id=h_item.get("wikidata_id"),
                        )
                        db.add(h_site)
            db.commit()
            logger.info("Heritage sites ingested", count=db.query(HeritageSite).count())

        # 3. Generate ~300 Synthetic Incidents & Reports
        logger.info("Generating ~300 synthetic incidents and reports with realistic clustering...")
        now = datetime.utcnow()
        incidents = []
        reports = []

        total_target = 310
        for i in range(total_target):
            # Pick a junction cluster with bias, or random ambient city point
            if random.random() < 0.70:
                cluster = random.choice(JUNCTIONS)
                # Scatter within ~180 meters
                lat_offset = random.gauss(0, 0.0012)
                lng_offset = random.gauss(0, 0.0012)
                lat = cluster["lat"] + lat_offset
                lng = cluster["lng"] + lng_offset
                category = random.choice(cluster["categories"])
                severity = min(5, max(1, int(random.gauss(3.5, 1.0))))
            else:
                lat = round(settings.CITY_LAT + random.uniform(-0.06, 0.06), 6)
                lng = round(settings.CITY_LNG + random.uniform(-0.06, 0.06), 6)
                category = random.choice(list(REPORT_DESCRIPTIONS.keys()))
                severity = random.randint(1, 4)

            # Realistic time distribution across past 30 days
            age_days = random.expovariate(1 / 7.0)  # skewed towards recent days
            age_days = min(30.0, age_days)
            occurred_at = now - timedelta(days=age_days, hours=random.randint(0, 23), minutes=random.randint(0, 59))

            # Credibility variation
            cred_rand = random.random()
            if cred_rand < 0.65:
                credibility = round(random.uniform(75.0, 96.0), 1)
                status = "ai_verified"
                reasons = ["Corroborated by 2 nearby reports", "Verified by spatial sensor cluster", "Photo matches category"]
            elif cred_rand < 0.88:
                credibility = round(random.uniform(50.0, 74.0), 1)
                status = "community"
                reasons = ["Community votes positive (Wilson score 0.62)", "Awaiting photo confirmation"]
            else:
                credibility = round(random.uniform(25.0, 49.0), 1)
                status = "unverified"
                reasons = ["Single uncorroborated report", "Low textual detail"]

            desc_list = REPORT_DESCRIPTIONS.get(category, ["Citizen observed urban infrastructure issue."])
            description = random.choice(desc_list)

            report = Report(
                user_session_id=f"synth_user_{random.randint(100, 999)}",
                category=category,
                description=description,
                lat=lat,
                lng=lng,
                sentiment=round(random.uniform(-0.8, -0.2), 2),
                severity=severity,
                credibility_score=credibility,
                verification_status=status,
                reasons=reasons,
                upvotes=random.randint(3, 24) if status != "unverified" else random.randint(0, 2),
                downvotes=random.randint(0, 3),
                is_synthetic=True,
                created_at=occurred_at,
            )
            db.add(report)
            db.flush()

            # If verified or official, create corresponding Incident
            if status in ["ai_verified", "community"]:
                incident = Incident(
                    source="report" if random.random() < 0.6 else "official",
                    category=category,
                    severity=severity,
                    lat=lat,
                    lng=lng,
                    occurred_at=occurred_at,
                    weight=round(credibility / 100.0, 2),
                    report_id=report.id,
                    is_synthetic=True,
                )
                db.add(incident)

        db.commit()
        total_reports = db.query(Report).count()
        total_incidents = db.query(Incident).count()
        logger.info("Synthetic dataset generated", total_reports=total_reports, total_incidents=total_incidents)

        # 4. Compute DBSCAN Hotspots
        logger.info("Computing initial DBSCAN hotspots for all time buckets...")
        compute_dbscan_hotspots(db)
        hotspot_count = db.query(Hotspot).count()
        logger.info("Hotspot calculation complete", hotspots_created=hotspot_count)

    except Exception as e:
        logger.error("Seeding failed", error=str(e))
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
