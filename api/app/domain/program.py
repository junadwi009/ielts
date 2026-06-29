"""
Domain layer — program milestones pure functions.
No I/O, no DB.
"""

from __future__ import annotations

from app.domain.leveling import BANDS, ielts_to_cefr

# Milestone count per program length
_MILESTONE_COUNTS: dict[int, int] = {30: 2, 90: 4, 180: 6}

_SKILLS = ("listening", "reading", "writing", "speaking")


def build_milestones(
    length_days: int,
    start_levels: dict[str, str],
    target_band: float,
) -> list[dict]:
    """
    Build an ordered list of milestone dicts for a learning program.

    Parameters
    ----------
    length_days  : 30, 90, or 180
    start_levels : mapping skill -> current CEFR band
    target_band  : IELTS band score target (e.g. 6.5)

    Returns
    -------
    List of milestone dicts (ordered by idx):
        {
            "idx"       : int,
            "dayTarget" : int,
            "title"     : str,
            "targets"   : {skill: cefr_band, ...}
        }
    """
    n = _MILESTONE_COUNTS[length_days]
    target_cefr = ielts_to_cefr(target_band)
    target_idx = BANDS.index(target_cefr)

    # Per-skill: compute start index and distance toward target
    skill_start: dict[str, int] = {}
    skill_distance: dict[str, int] = {}
    for skill in _SKILLS:
        start_band = start_levels.get(skill, BANDS[0])
        si = BANDS.index(start_band)
        skill_start[skill] = si
        # Never downgrade: distance is 0 if already at/above target
        skill_distance[skill] = max(0, target_idx - si)

    milestones: list[dict] = []
    for i in range(n):
        day_target = round(length_days * (i + 1) / n)

        targets: dict[str, str] = {}
        for skill in _SKILLS:
            si = skill_start[skill]
            dist = skill_distance[skill]
            steps = round((i + 1) / n * dist)
            # Clamp: never exceed target, never go below start
            band_idx = min(si + steps, target_idx)
            band_idx = max(band_idx, si)
            targets[skill] = BANDS[band_idx]

        title = (
            f"Day {day_target}: "
            + ", ".join(f"{skill.title()} {targets[skill]}" for skill in _SKILLS)
        )

        milestones.append(
            {
                "idx": i,
                "dayTarget": day_target,
                "title": title,
                "targets": targets,
            }
        )

    return milestones
