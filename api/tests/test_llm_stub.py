import pytest
from app.config import Config
from app.services.llm import LlmGateway
from app.errors import ApiError


def test_stub_generate_returns_fixture():
    gw = LlmGateway(Config({"LLM_MODE": "stub"}))
    out = gw.generate("generate", skill="reading", band="B2")
    assert out["stub"] is True
    assert "passage" in out


def test_stub_never_leaks_key():
    gw = LlmGateway(Config({"LLM_MODE": "stub"}))
    out = gw.score("writing", essay="hello")
    assert "api_key" not in out and "OPENROUTER_API_KEY" not in out
    assert out["stub"] is True


def test_live_mode_raises():
    gw = LlmGateway(Config({"LLM_MODE": "live"}))
    with pytest.raises(ApiError):
        gw.generate("generate", skill="reading", band="B2")
