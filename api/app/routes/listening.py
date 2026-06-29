"""
POST /api/listening/generate — generate a listening transcript + questions via the gateway.
"""
from flask import Blueprint, jsonify, request

from app.routes._deps import _gateway

bp = Blueprint("listening", __name__)


@bp.post("/api/listening/generate")
def listening_generate():
    body = request.get_json(force=True) or {}
    band = body.get("band", "B1")
    gateway = _gateway()
    out = gateway.generate("generate", skill="listening", band=band)
    return jsonify(out), 200
