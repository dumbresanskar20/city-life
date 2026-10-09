import re
import math
from typing import Dict, List, Tuple

# Urban civic keywords for category alignment
CATEGORY_LEXICON: Dict[str, List[str]] = {
    "pothole": ["pothole", "crater", "road", "asphalt", "hole", "cavity", "tar", "surface", "crack", "scooter", "two-wheeler"],
    "broken_light": ["light", "streetlight", "lamp", "dark", "illumination", "pole", "wiring", "blackout", "pitch", "night"],
    "waterlogging": ["water", "flood", "logging", "drain", "drainage", "stagnant", "puddle", "overflow", "gutter", "rain"],
    "accident": ["accident", "collision", "crash", "hit", "vehicle", "bike", "car", "rickshaw", "injured", "skid"],
    "harassment": ["harassment", "loitering", "unsafe", "stalking", "teasing", "isolated", "suspicious", "threat", "shouting"],
    "garbage": ["garbage", "trash", "waste", "dump", "debris", "bin", "litter", "smell", "plastic", "overflowing"],
    "traffic": ["traffic", "congestion", "jam", "gridlock", "signal", "stalled", "bottleneck", "vehicle", "delay"],
}

LOCATION_INDICATORS = ["road", "street", "junction", "signal", "near", "opposite", "corner", "chowk", "bridge", "lane", "stop", "station"]


def analyze_text_quality(text: str) -> Tuple[float, List[str]]:
    """Evaluates text quality and specificity (0-1)."""
    words = re.findall(r"\w+", text.lower())
    reasons = []

    if len(words) < 5:
        return 0.2, ["Description is very brief"]

    length_score = min(1.0, len(words) / 25.0)

    has_location = any(loc in words for loc in LOCATION_INDICATORS)
    loc_score = 1.0 if has_location else 0.4
    if has_location:
        reasons.append("Contains concrete urban location indicators")

    # Repetition/Spam penalty
    unique_ratio = len(set(words)) / max(1, len(words))
    spam_penalty = 1.0 if unique_ratio > 0.6 else 0.4

    score = 0.5 * length_score + 0.3 * loc_score + 0.2 * spam_penalty
    return min(1.0, max(0.1, score)), reasons


def evaluate_category_consistency(text: str, category: str) -> Tuple[float, List[str]]:
    """Evaluates topic/category alignment (0-1)."""
    words = set(re.findall(r"\w+", text.lower()))
    expected_words = set(CATEGORY_LEXICON.get(category, []))

    matches = words.intersection(expected_words)
    if matches:
        return 0.95, [f"Description matches chosen category '{category}' ({', '.join(list(matches)[:3])})"]
    elif len(words) > 10:
        return 0.60, ["General description aligns with urban issue"]
    else:
        return 0.40, ["Low specific keyword overlap with category"]


def compute_text_similarity(text1: str, text2: str) -> float:
    """Computes Jaccard / Cosine bag-of-words similarity between two texts."""
    w1 = set(re.findall(r"\w+", text1.lower()))
    w2 = set(re.findall(r"\w+", text2.lower()))
    if not w1 or not w2:
        return 0.0
    intersection = w1.intersection(w2)
    union = w1.union(w2)
    return len(intersection) / len(union)
