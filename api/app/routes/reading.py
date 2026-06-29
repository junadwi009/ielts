"""
POST /api/reading/generate — generate a reading passage + questions via the gateway.
"""
from flask import Blueprint, jsonify, request

from app.routes._deps import _gateway

bp = Blueprint("reading", __name__)


@bp.post("/api/reading/generate")
def reading_generate():
    body = request.get_json(force=True) or {}
    band = body.get("band", "B2")
    gateway = _gateway()
    out = gateway.generate("generate", skill="reading", band=band)
    # gateway-defined shape; passthrough dict — shape validated client-side
    return jsonify(out), 200
