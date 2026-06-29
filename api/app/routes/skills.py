"""
GET /api/skill-levels — return current CEFR band per skill for the active user.
"""
from flask import Blueprint, jsonify

from app.schemas import SkillLevelOut
from app.routes._deps import _repo

bp = Blueprint("skills", __name__)


@bp.get("/api/skill-levels")
def skill_levels():
    repo = _repo()
    user = repo.get_user()
    if user is None:
        return jsonify([]), 200

    levels = repo.get_skill_levels(user.id)
    return jsonify([SkillLevelOut(skill=s, band=b).model_dump(by_alias=True) for s, b in levels]), 200
