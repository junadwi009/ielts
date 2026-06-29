"""
Tests for practice, program, and tips routes.
Uses client_with_seed fixture from conftest.py.
"""


def test_practice_generate_and_status(client_with_seed):
    j = client_with_seed.post("/api/practice/generate", json={}).get_json()
    assert j["jobId"] == "stub-1"
    st = client_with_seed.get(f"/api/practice/status?jobId={j['jobId']}").get_json()
    assert st["done"] is True and st["progress"] == 100


def test_practice_set_served(client_with_seed):
    r = client_with_seed.get("/api/practice/set?skill=reading&band=B2")
    assert r.status_code == 200
    body = r.get_json()
    assert "questions" in body


def test_practice_set_fallback_any_band(client_with_seed):
    # a band with no exact match falls back to any set for the skill
    r = client_with_seed.get("/api/practice/set?skill=reading&band=C2")
    assert r.status_code == 200
    assert "questions" in r.get_json()


def test_program_creates_milestones(client_with_seed):
    client_with_seed.post("/api/onboarding", json={"name": "A", "goal": "work", "targetBand": 6.5})
    r = client_with_seed.post("/api/program", json={"lengthDays": 90})
    assert r.status_code == 200
    body = r.get_json()
    assert len(body["milestones"]) == 4
    ms = client_with_seed.get("/api/program/milestones").get_json()
    assert len(ms) == 4


def test_tips_reading(client_with_seed):
    r = client_with_seed.get("/api/tips/reading")
    assert r.status_code == 200
    assert "bullets" in r.get_json()


def test_tips_unknown_404(client_with_seed):
    assert client_with_seed.get("/api/tips/swimming").status_code == 404
