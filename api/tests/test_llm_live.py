import json
import pytest
from app.config import Config
from app.services.llm import LlmGateway
from app.errors import ApiError

class _FakeMsg:  # minimal OpenAI response shims
    def __init__(self, content): self.message = type("M", (), {"content": content})
class _FakeResp:
    def __init__(self, content): self.choices = [_FakeMsg(content)]
class _FakeChat:
    def __init__(self, recorder): self._rec = recorder
    def create(self, model, messages, **kw):
        self._rec["model"] = model
        self._rec["messages"] = messages
        return _FakeResp(self._rec["reply"])
class _FakeClient:
    def __init__(self, recorder): self.chat = type("C", (), {"completions": _FakeChat(recorder)})

def _gw(reply):
    gw = LlmGateway(Config({"LLM_MODE": "live", "OPENROUTER_API_KEY": "x",
                            "MODEL_GENERATE": "gen-model", "MODEL_SCORE": "score-model"}))
    rec = {"reply": reply}
    gw._openai_client = _FakeClient(rec)   # inject the fake; bypass real OpenAI()
    gw._rec = rec
    return gw, rec

def test_generate_routes_to_model_generate():
    gw, rec = _gw('{"title":"t","passage":"p","questions":[]}')
    out = gw.generate("generate", skill="reading", band="B2")
    assert rec["model"] == "gen-model"        # cheap model for generation (SC-006)
    assert out["passage"] == "p"
    assert "stub" not in out                   # live path does not set stub

def test_score_routes_to_model_score():
    gw, rec = _gw('{"bands":{"overall":6.0},"cefr":"B2"}')
    out = gw.score("writing", taskType="task2", prompt="p", essay="hello")
    assert rec["model"] == "score-model"       # strong model for scoring (SC-006)
    assert out["bands"]["overall"] == 6.0

def test_live_strips_code_fences():
    gw, rec = _gw('```json\n{"bands":{"overall":5.5},"cefr":"B2"}\n```')
    out = gw.score("speaking", part="part2", question="q", transcript="t")
    assert out["cefr"] == "B2"

def test_live_no_key_raises():
    gw = LlmGateway(Config({"LLM_MODE": "live"}))  # no OPENROUTER_API_KEY
    with pytest.raises(ApiError):
        gw.generate("generate", skill="reading", band="B2")

def test_live_never_returns_key():
    gw, rec = _gw('{"bands":{"overall":6.0},"cefr":"B2","api_key":"LEAK"}')
    out = gw.score("writing", taskType="task2", prompt="p", essay="x")
    assert "api_key" not in out and "OPENROUTER_API_KEY" not in out
