"""
POST /api/speaking/evaluate — score a speaking attempt via the gateway.
"""
from flask import Blueprint, jsonify, request

from app.routes._deps import _gateway

bp = Blueprint("speaking", __name__)


@bp.post("/api/speaking/evaluate")
def speaking_evaluate():
    body = request.get_json(force=True) or {}
    gateway = _gateway()
    out = gateway.score(
        "speaking",
        part=body.get("part"),
        question=body.get("question"),
        transcript=body.get("transcript", ""),
    )
    # gateway-defined shape; passthrough dict — shape validated client-side
    return jsonify(out), 200
