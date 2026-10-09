import json
import os
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger

OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter"


class OverpassClient:
    def __init__(self):
        self.use_mocks = settings.USE_MOCKS
        self.bbox = settings.parsed_bbox  # (south, west, north, east)

    async def fetch_places_and_roads(self) -> Dict[str, Any]:
        """
        Fetches places, road segments, and points of interest from Overpass.
        Falls back to bundled fallback fixtures when in mock mode or on network error.
        """
        if not self.use_mocks:
            try:
                logger.info("Attempting live Overpass API query", bbox=self.bbox)
                south, west, north, east = self.bbox
                query = f"""
                [out:json][timeout:15];
                (
                  node["amenity"~"restaurant|cafe|fast_food|bar"]({south},{west},{north},{east});
                  node["tourism"~"hotel|hostel|museum|attraction|monument"]({south},{west},{north},{east});
                  node["historic"]({south},{west},{north},{east});
                  way["highway"~"primary|secondary|tertiary|residential"]({south},{west},{north},{east});
                );
                out center 150;
                """
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(OVERPASS_ENDPOINT, data={"data": query})
                    if resp.status_code == 200:
                        data = resp.json()
                        elements = data.get("elements", [])
                        if elements:
                            logger.info("Live Overpass data retrieved", count=len(elements))
                            return self._process_elements(elements)
            except Exception as e:
                logger.warning("Overpass API request failed, switching to local fixture", error=str(e))

        logger.info("Using bundled local fixtures for places & roads")
        return self._load_fallback_fixtures()

    def _process_elements(self, elements: List[Dict[str, Any]]) -> Dict[str, Any]:
        places = []
        roads = []
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name")
            if not name:
                continue

            lat = el.get("lat") or el.get("center", {}).get("lat")
            lng = el.get("lon") or el.get("center", {}).get("lon")
            if not lat or not lng:
                continue

            category = "other"
            if "amenity" in tags and tags["amenity"] in ["restaurant", "cafe", "fast_food", "bar"]:
                category = "food"
            elif "tourism" in tags and tags["tourism"] in ["hotel", "hostel"]:
                category = "hotel"
            elif "historic" in tags or ("tourism" in tags and tags["tourism"] in ["museum", "monument"]):
                category = "heritage"
            elif "tourism" in tags and tags["tourism"] in ["attraction", "theme_park"]:
                category = "attraction"

            places.append({
                "osm_id": str(el.get("id")),
                "name": name,
                "category": category,
                "subcategory": tags.get("amenity") or tags.get("tourism") or tags.get("historic"),
                "lat": lat,
                "lng": lng,
                "address": tags.get("addr:street", f"{name}, {settings.CITY_NAME}"),
                "price_level": 2,
                "rating": 4.2,
                "rating_count": 120,
                "tags": [k for k in tags.keys() if len(k) < 20][:5],
                "cleanliness_score": 75.0,
                "safety_score": 80.0,
                "affordability_score": 70.0,
                "accessibility_score": 75.0,
                "overall_score": 76.0,
                "source": "osm",
            })
        return {"places": places, "roads": roads}

    def _load_fallback_fixtures(self) -> Dict[str, Any]:
        curr_dir = os.path.dirname(__file__)
        fixture_path = os.path.abspath(os.path.join(curr_dir, "..", "..", "seed", "fixtures", "places_pune_fallback.json"))
        if os.path.exists(fixture_path):
            with open(fixture_path, "r", encoding="utf-8") as f:
                places = json.load(f)
                return {"places": places, "roads": []}
        return {"places": [], "roads": []}
