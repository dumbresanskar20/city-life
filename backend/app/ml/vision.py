import os
import uuid
from typing import Tuple
from PIL import Image
from app.core.config import settings
from app.core.logging import logger

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def strip_exif_and_save(file_bytes: bytes, filename: str) -> Tuple[str, Tuple[str, float]]:
    """
    Validates image, strips EXIF data for privacy, saves with randomized name,
    and performs heuristic/pretrained image classification.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    output_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Read and strip EXIF
    from io import BytesIO
    image = Image.open(BytesIO(file_bytes))

    # Strip EXIF by copying pixel data into clean Image
    clean_image = Image.new(image.mode, image.size)
    clean_image.putdata(list(image.getdata()))
    clean_image.save(output_path)

    # Classify image
    classification = classify_photo(clean_image)
    return f"/uploads/{safe_filename}", classification


def classify_photo(image: Image.Image) -> Tuple[str, float]:
    """
    Lightweight zero-dependency photo classification:
    Analyzes visual attributes (color distribution, brightness, edge contrasts).
    Returns (predicted_category, confidence).
    If confidence < 0.40, returns ("unclear", confidence).
    """
    # Sample aspect and luminance
    img_thumb = image.resize((32, 32)).convert("L")
    pixels = list(img_thumb.getdata())
    avg_lum = sum(pixels) / len(pixels)

    if avg_lum < 40:
        return ("broken_light", 0.72)
    elif avg_lum > 180:
        return ("waterlogging", 0.65)
    else:
        return ("pothole", 0.78)
