"""
GET /api/tips/<skill> — return fixture tips for a given skill (no LLM).
"""
from flask import Blueprint, jsonify

from app.errors import ApiError
from app.data.seed import load_fixture

bp = Blueprint("tips", __name__)


@bp.get("/api/tips/<skill>")
def tips(skill: str):
    all_tips = load_fixture("tips")
    if skill not in all_tips:
        raise ApiError("NOT_FOUND", f"no tips for {skill}", 404)
    return jsonify(all_tips[skill]), 200
