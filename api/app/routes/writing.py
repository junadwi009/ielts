"""
POST /api/writing/evaluate — score a writing attempt via the gateway.
"""
from flask import Blueprint, jsonify, request

from app.routes._deps import _gateway
from app.services.essay_metrics import compute_metrics

bp = Blueprint("writing", __name__)


@bp.post("/api/writing/evaluate")
def writing_evaluate():
    body = request.get_json(force=True) or {}
    essay = body.get("essay", "")

    # Compute deterministic metrics before calling the LLM
    metrics = compute_metrics(essay)

    # Build a short summary string for the examiner prompt
    mtld_val = metrics["lexicalDiversity"].get("mtld")
    mtld_str = f"{mtld_val:.1f}" if mtld_val is not None else "N/A"
    mean_sent = (
        metrics["syntax"].get("meanSentenceLength")
        if metrics.get("syntax")
        else None
    )
    mean_sent_str = f"{mean_sent:.1f}" if mean_sent is not None else "N/A"
    metrics_summary = (
        f"words={metrics['wordCount']}, "
        f"FleschKincaidGrade={metrics['readability']['fleschKincaidGrade']}, "
        f"MTLD={mtld_str}, "
        f"meanSentenceLength={mean_sent_str}"
    )

    gateway = _gateway()
    out = gateway.score(
        "writing",
        taskType=body.get("taskType"),
        prompt=body.get("prompt"),
        essay=essay,
        metricsSummary=metrics_summary,
    )

    # Attach metrics to the response (works in both stub and live mode)
    out["metrics"] = metrics

    # gateway-defined shape; passthrough dict — shape validated client-side
    return jsonify(out), 200
