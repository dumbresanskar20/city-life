from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.heritage import HeritageSite
from app.models.place import Place
from app.schemas.heritage import HeritageOut, HeritageStoryResponse

router = APIRouter(prefix="/heritage", tags=["Heritage"])


@router.get("", response_model=List[HeritageOut])
def list_heritage_sites(db: Session = Depends(get_db)):
    sites = db.query(HeritageSite).all()
    return sites


@router.get("/{site_id}", response_model=HeritageOut)
def get_heritage_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(HeritageSite).filter(HeritageSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Heritage site not found")
    return site


@router.post("/{site_id}/story", response_model=HeritageStoryResponse)
def get_heritage_story(site_id: int, db: Session = Depends(get_db)):
    site = db.query(HeritageSite).filter(HeritageSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Heritage site not found")

    place_name = site.place.name if site.place else "Landmark"

    # Pre-cached / LLM curated authentic stories
    stories = {
        "Shaniwar Wada": (
            "Standing before the colossal Delhi Gate of Shaniwar Wada, you face the grand heart of the Maratha Empire. "
            "Commissioned in 1732 by Peshwa Baji Rao I, these teakwood bastions commanded armies across the subcontinent. "
            "Though devastating fires in 1828 reduced its seven-story palaces, the resilient granite plinths, the lotus fountains, "
            "and the spiked wooden gates still whisper tales of warrior valor and courtly grandeur."
        ),
        "Aga Khan Palace": (
            "Built in 1892 by Sultan Muhammed Shah Aga Khan III to provide livelihood to famine-struck citizens, "
            "this Italian-arched sanctuary evolved into a cradle of India's independence struggle. "
            "Here, Mahatma Gandhi, Kasturba Gandhi, and Sarojini Naidu were held following the Quit India call in 1942. "
            "Walking its tranquil shaded pathways today offers a poignant meditation on non-violent conviction."
        ),
        "Sinhagad Fort": (
            "Perched 1,300 meters high upon the misty crests of the Sahyadris, Sinhagad was contested across centuries. "
            "In 1670, Tanaji Malusare led a daring midnight assault scaling the precipitous sheer cliff face with monitor lizards. "
            "Upon his heroic martyrdom securing the fortress, Chhatrapati Shivaji Maharaj uttered the immortal words: "
            "'The fort is won, but the lion is lost.'"
        ),
        "Pataleshwar Cave Temple": (
            "Carved directly from a single massive basalt outcrop in the 8th century during the Rashtrakuta dynasty, "
            "Pataleshwar is an acoustic wonder dedicated to Lord Shiva. Its monolithic circular Nandi mandapa rests on massive pillars, "
            "creating an underground haven of profound coolness and serenity amidst the bustling heart of modern Pune."
        ),
    }

    story_text = stories.get(
        place_name,
        f"{place_name} is an architectural marvel of {site.era}. {site.summary} It stands as an enduring emblem of regional heritage and resilience."
    )

    return HeritageStoryResponse(
        id=site.id,
        name=place_name,
        era=site.era,
        story=story_text,
    )
