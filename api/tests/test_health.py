from app import create_app

def test_health_ok():
    app = create_app({"TESTING": True})
    client = app.test_client()
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["ok"] is True
    assert body["llmMode"] == "stub"
    assert body["providerConfigured"] is False
    assert body["asrReady"] is False
