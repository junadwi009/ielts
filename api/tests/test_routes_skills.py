"""
Tests for reading/listening/writing/speaking stub skill endpoints.
Uses client_with_seed fixture from conftest.py.
"""


def body_has_questions(b):
    return "questions" in b


def test_writing_evaluate_stub(client_with_seed):
    r = client_with_seed.post(
        "/api/writing/evaluate",
        json={"taskType": "task2", "prompt": "p", "essay": "My essay text."},
    )
    assert r.status_code == 200
    body = r.get_json()
    assert "bands" in body and "cefr" in body and body["stub"] is True
    # no key leak
    assert "OPENROUTER_API_KEY" not in body and "api_key" not in body


def test_speaking_evaluate_stub(client_with_seed):
    r = client_with_seed.post(
        "/api/speaking/evaluate",
        json={"part": "part2", "question": "Describe a book", "transcript": "I read..."},
    )
    assert r.status_code == 200
    body = r.get_json()
    assert "bands" in body and body["stub"] is True


def test_reading_generate_stub(client_with_seed):
    r = client_with_seed.post("/api/reading/generate", json={"band": "B2"})
    assert r.status_code == 200
    body = r.get_json()
    assert "questions" in body and body["stub"] is True


def test_listening_generate_default_band(client_with_seed):
    r = client_with_seed.post("/api/listening/generate", json={})
    assert r.status_code == 200
    assert body_has_questions(r.get_json())
