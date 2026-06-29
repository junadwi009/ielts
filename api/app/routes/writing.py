"""
POST /api/writing/evaluate — score a writing attempt via the gateway.
"""
from flask import Blueprint, jsonify, request

from app.routes._deps import _gateway

bp = Blueprint("writing", __name__)


@bp.post("/api/writing/evaluate")
def writing_evaluate():
    body = request.get_json(force=True) or {}
    gateway = _gateway()
    out = gateway.score(
        "writing",
        taskType=body.get("taskType"),
        prompt=body.get("prompt"),
        essay=body.get("essay", ""),
    )
    # gateway-defined shape; passthrough dict — shape validated client-side
    return jsonify(out), 200
