"""
LLM Gateway — the SINGLE entry point for all language-model access.

Phase 1 (stub mode):
  Responses are served from ``fixtures/stub_responses.json`` via
  ``app.data.seed.load_fixture``. No network calls are made and no
  API key is ever included in the return value.

Phase 2 (live mode) will implement OpenRouter via the OpenAI SDK;
  until then, live mode raises ApiError("LLM_UNAVAILABLE", ..., 502).

Rules enforced here:
  - NEVER return an API key in any output dict.
  - NEVER call the LLM SDK outside this class.
  - ALL prompt templates live in app.services.prompts, not here.
"""

from __future__ import annotations

from app.data.seed import load_fixture
from app.errors import ApiError


class LlmGateway:
    """
    Central gateway for LLM calls.

    Parameters
    ----------
    config : app.config.Config
        Application configuration object.  ``config.LLM_MODE`` controls
        whether stub or live mode is used.
    """

    def __init__(self, config) -> None:
        self._config = config
        self._stub_data: dict | None = None  # lazily loaded on first access

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _stubs(self) -> dict:
        """Return the stub fixture, loading it exactly once per instance."""
        if self._stub_data is None:
            self._stub_data = load_fixture("stub_responses")
        return self._stub_data

    @staticmethod
    def _sanitise(payload: dict) -> dict:
        """
        Remove any key that could be an API credential from *payload*.

        This is a defence-in-depth measure — the gateway should never
        construct a response that includes a key in the first place, but
        we strip known sensitive key names before returning.
        """
        sensitive = {"api_key", "OPENROUTER_API_KEY", "ANTHROPIC_API_KEY"}
        return {k: v for k, v in payload.items() if k not in sensitive}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        task: str,
        skill: str | None = None,
        band: str | None = None,
        **kw,
    ) -> dict:
        """
        Generate content (passage, transcript, vocab list, or lesson).

        Parameters
        ----------
        task  : str   Task name, e.g. ``"generate"``.
        skill : str   Skill name, e.g. ``"reading"``, ``"listening"``.
        band  : str   CEFR band, e.g. ``"B2"``.
        **kw  :       Extra keyword arguments (reserved for Phase 2 live path).

        Returns
        -------
        dict
            Fixture payload merged with ``{"stub": True}`` in stub mode.

        Raises
        ------
        ApiError
            - ``LLM_UNAVAILABLE`` (502) if the stub has no matching entry.
            - ``LLM_UNAVAILABLE`` (502) in live mode (Phase 2 not yet wired).
        """
        if self._config.LLM_MODE == "stub":
            return self._stub_generate(task, skill, band)

        # Live mode — Phase 2 will replace this raise with an OpenRouter call.
        raise ApiError(
            "LLM_UNAVAILABLE",
            "live LLM not wired in Phase 1",
            502,
        )

    def score(self, task: str, **kw) -> dict:
        """
        Score a learner's written or spoken response.

        Parameters
        ----------
        task : str   Task name, e.g. ``"writing"`` or ``"speaking"``.
        **kw :       Extra keyword arguments (reserved for Phase 2 live path,
                     e.g. ``essay=``, ``transcript=``).

        Returns
        -------
        dict
            Fixture payload merged with ``{"stub": True}`` in stub mode.

        Raises
        ------
        ApiError
            - ``LLM_UNAVAILABLE`` (502) if the stub has no matching entry.
            - ``LLM_UNAVAILABLE`` (502) in live mode (Phase 2 not yet wired).
        """
        if self._config.LLM_MODE == "stub":
            return self._stub_score(task)

        # Live mode — Phase 2 will replace this raise with an OpenRouter call.
        raise ApiError(
            "LLM_UNAVAILABLE",
            "live LLM not wired in Phase 1",
            502,
        )

    # ------------------------------------------------------------------
    # Stub-mode resolution
    # ------------------------------------------------------------------

    def _stub_generate(self, task: str, skill: str | None, band: str | None) -> dict:
        """
        Look up a generate stub.

        Key strategy:
          1. Exact key: ``"{task}:{skill}:{band}"``
          2. Band fallback: first key matching ``"{task}:{skill}:"``
          3. Raise ApiError if nothing found.
        """
        stubs = self._stubs()
        exact_key = f"{task}:{skill}:{band}"

        if exact_key in stubs:
            payload = self._sanitise(dict(stubs[exact_key]))
            payload["stub"] = True
            return payload

        # Fallback: any entry with matching task+skill regardless of band
        prefix = f"{task}:{skill}:"
        for key, value in stubs.items():
            if key.startswith(prefix):
                payload = self._sanitise(dict(value))
                payload["stub"] = True
                return payload

        raise ApiError(
            "LLM_UNAVAILABLE",
            f"no stub for {exact_key}",
            502,
        )

    def _stub_score(self, task: str) -> dict:
        """
        Look up a score stub.

        Key: ``"score:{task}"``
        Raise ApiError if not found.
        """
        stubs = self._stubs()
        key = f"score:{task}"

        if key in stubs:
            payload = self._sanitise(dict(stubs[key]))
            payload["stub"] = True
            return payload

        raise ApiError(
            "LLM_UNAVAILABLE",
            f"no stub for {key}",
            502,
        )
