"""Pydantic v2 request/response contracts for the IELTS Coach API.

Wire format: camelCase JSON.
Python attributes: snake_case.
All models use Field aliases for camelCase keys + populate_by_name=True so
routes can construct models with either the alias or the Python name.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Enums / Literals
# ---------------------------------------------------------------------------

Goal = Literal["work", "study_abroad", "other"]
Cefr = Literal["A1A2", "B1", "B2", "C1", "C2"]
Skill = Literal["listening", "reading", "writing", "speaking"]
ProgramLength = Literal[30, 90, 180]


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class OnboardingIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1)
    goal: Goal
    target_band: float = Field(alias="targetBand", ge=4.0, le=9.0)
    skill_targets: dict = Field(alias="skillTargets", default_factory=dict)


class PlacementSubmitIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    combo_id: int = Field(alias="comboId")
    answers: dict
    writing_samples: dict = Field(alias="writingSamples", default_factory=dict)
    speaking_text: str | None = Field(alias="speakingText", default=None)
    duration_sec: int = Field(alias="durationSec", default=0)


class ProgramIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    length_days: ProgramLength = Field(alias="lengthDays")


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class PlacementStartOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    combo_id: int = Field(alias="comboId")
    sections: dict
    target_minutes: int = Field(alias="targetMinutes")
    items: list = []


class PerSkill(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cefr: Cefr
    ielts: float | None = None
    ielts_approx: float | None = Field(alias="ieltsApprox", default=None)
    raw: str | None = None
    confidence: str | None = None
    criteria: dict = Field(default_factory=dict)
    metrics: dict = Field(default_factory=dict)


class PlacementResultOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    per_skill: dict[str, PerSkill] = Field(alias="perSkill")
    overall_band: float = Field(alias="overallBand")
    cefr: Cefr
    gap_to_target: float = Field(alias="gapToTarget")


class MilestoneOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    idx: int
    day_target: int = Field(alias="dayTarget")
    title: str
    targets: dict


class ProgramOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    program: dict
    milestones: list[MilestoneOut]


class SkillLevelOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    skill: Skill
    band: Cefr


class GenerateJobOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    job_id: str = Field(alias="jobId")


class JobStatusOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    done: bool
    progress: int


# ---------------------------------------------------------------------------
# Public surface
# ---------------------------------------------------------------------------

__all__ = [
    "Goal",
    "Cefr",
    "Skill",
    "ProgramLength",
    "OnboardingIn",
    "PlacementSubmitIn",
    "ProgramIn",
    "PlacementStartOut",
    "PerSkill",
    "PlacementResultOut",
    "MilestoneOut",
    "ProgramOut",
    "SkillLevelOut",
    "GenerateJobOut",
    "JobStatusOut",
]
