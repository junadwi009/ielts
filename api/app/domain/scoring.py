"""
Domain layer — placement scoring pure functions.
No I/O.  All inputs/outputs are plain Python values.
"""

from __future__ import annotations

from app.domain.leveling import BANDS


def locator_band(
    tier_results: dict[str, tuple[int, int]],
    pass_threshold: float = 0.667,
) -> str:
    """
    Determine the highest CEFR band at which the user passes.

    Rules
    -----
    - Iterate tiers in BANDS order (low → high: A1A2, B1, B2, C1, C2).
    - A tier "passes" if:
        * total == 0  (no items → treated as passed/skipped), OR
        * correct / total >= pass_threshold
    - Placement = the HIGHEST band such that that band AND every lower band pass
      (monotonic: once a tier fails, stop advancing).
    - If A1A2 fails → return "A1A2" (floor rule).

    Parameters
    ----------
    tier_results : dict mapping band label → (correct, total)
    pass_threshold : fraction required to pass (default 2/3 ≈ 0.667)

    Returns
    -------
    The placed CEFR band string, e.g. "B2".
    """
    placement = BANDS[0]  # floor: A1A2

    for band in BANDS:
        if band not in tier_results:
            # band not present in results — treat as skipped (pass)
            placement = band
            continue

        correct, total = tier_results[band]

        if total == 0:
            # No items for this tier — treated as passed
            placement = band
        elif correct / total >= pass_threshold:
            # Tier passes — advance placement
            placement = band
        else:
            # Tier fails — stop here (monotonic rule)
            break

    return placement


def overall_band(skill_bands: dict[str, float]) -> float:
    """
    Compute the overall IELTS band from per-skill numeric scores.

    Rounds the mean to the nearest 0.5:  round(mean * 2) / 2
    """
    values = list(skill_bands.values())
    mean = sum(values) / len(values)
    return round(mean * 2) / 2
