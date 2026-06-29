"""
Domain layer — CEFR leveling pure functions.
No I/O, no DB. All values are fixed project-wide.
"""

from __future__ import annotations

BANDS: list[str] = ["A1A2", "B1", "B2", "C1", "C2"]

# IELTS → CEFR thresholds (PRD §5.1)
_IELTS_THRESHOLDS: list[tuple[float, str]] = [
    (4.0,  "A1A2"),
    (5.25, "B1"),
    (6.75, "B2"),
    (8.25, "C1"),
]

# CEFR band → (low IELTS, high IELTS) (PRD §5.1)
_CEFR_RANGES: dict[str, tuple[float, float]] = {
    "A1A2": (2.0, 3.5),
    "B1":   (4.0, 5.0),
    "B2":   (5.5, 6.5),
    "C1":   (7.0, 8.0),
    "C2":   (8.5, 9.0),
}

# Generation parameters per band (PRD §5.2)
# reading length: A1A2 350, B1 575, B2 700, C1 850, C2 900
# listening ~60% of reading
_BAND_PARAMS: dict[str, dict[str, object]] = {
    "A1A2": {
        "lexical_freq":        "high",
        "sentence_complexity": "simple",
        "reading_length":      350,
        "listening_length":    210,
        "question_types":      ["literal", "form_completion"],
    },
    "B1": {
        "lexical_freq":        "mid",
        "sentence_complexity": "mixed",
        "reading_length":      575,
        "listening_length":    345,
        "question_types":      ["literal", "form_completion", "short_answer"],
    },
    "B2": {
        "lexical_freq":        "low",
        "sentence_complexity": "complex",
        "reading_length":      700,
        "listening_length":    420,
        "question_types":      ["tfng", "heading_match", "short_answer"],
    },
    "C1": {
        "lexical_freq":        "rare",
        "sentence_complexity": "academic",
        "reading_length":      850,
        "listening_length":    510,
        "question_types":      ["tfng", "heading_match", "inference", "paraphrase"],
    },
    "C2": {
        "lexical_freq":        "rare",
        "sentence_complexity": "academic",
        "reading_length":      900,
        "listening_length":    540,
        "question_types":      ["tfng", "heading_match", "inference", "paraphrase"],
    },
}


def next_band(band: str) -> str:
    """Return the next higher CEFR band, capped at 'C2'."""
    idx = BANDS.index(band)
    return BANDS[min(idx + 1, len(BANDS) - 1)]


def ielts_to_cefr(score: float) -> str:
    """Map an IELTS band score to the corresponding CEFR band."""
    for threshold, label in _IELTS_THRESHOLDS:
        if score < threshold:
            return label
    return "C2"


def cefr_to_ielts(band: str) -> tuple[float, float]:
    """Return the (low, high) IELTS score range for a CEFR band."""
    return _CEFR_RANGES[band]


def band_params(skill: str, band: str) -> dict:
    """
    Return generation parameters for a given skill and CEFR band.

    Keys guaranteed:
        lexical_freq        : "high" | "mid" | "low" | "rare"
        sentence_complexity : "simple" | "mixed" | "complex" | "academic"
        length              : int  (reading word count or listening transcript word count)
        question_types      : list[str]
        target_raw_band     : float  (midpoint of cefr_to_ielts(band))
    """
    raw = _BAND_PARAMS[band]
    low, high = cefr_to_ielts(band)
    target_raw_band = round((low + high) / 2, 2)

    if skill == "listening":
        length = raw["listening_length"]
    else:
        # Default to reading length for "reading" and any unknown skill
        length = raw["reading_length"]

    return {
        "lexical_freq":        raw["lexical_freq"],
        "sentence_complexity": raw["sentence_complexity"],
        "length":              length,
        "question_types":      list(raw["question_types"]),
        "target_raw_band":     target_raw_band,
    }
