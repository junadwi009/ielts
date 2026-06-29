# live-llm-openrouter — 2026-06-29

Phase 2a: wired the LIVE branch of the LLM gateway to OpenRouter (via the OpenAI Python SDK) with task-routed models. Stub mode stays the default; live verified end-to-end.

## What changed
- **`api/app/services/llm.py`** — implemented the live path: lazy `OpenAI(base_url=OPENROUTER_BASE_URL, api_key=OPENROUTER_API_KEY)` client; `generate(task,skill,band)` formats the `GENERATE_PROMPTS` template (band-parameterized) and calls `MODEL_GENERATE`; `score(task,**kw)` formats `SCORE_PROMPTS` and calls `MODEL_SCORE`; shared `_chat()` does a robust JSON extract (strips ``` fences, finds first `{…}`); all outputs run through `_sanitise` (never return a key); failures raise `ApiError("LLM_UNAVAILABLE", 502)`. Stub branch untouched.
- **`api/app/config.py`** — `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`); defaults `MODEL_GENERATE=anthropic/claude-haiku-4-5`, `MODEL_SCORE=anthropic/claude-sonnet-4-6`; overridable for tests.
- **`api/app/services/prompts.py`** — writing scorer gained a `{prompt}` block so Task Response is graded against the actual task prompt (was previously blind to it).
- **`api/requirements.txt`** — added `openai==1.59.6`. **`api/Dockerfile`** — `--timeout 120 --workers 2` on gunicorn.
- **`.env.example`** — model slugs set as defaults.
- **Tests:** `api/tests/test_llm_live.py` — mocked OpenAI client; asserts the SC-006 routing guarantee (generate→`MODEL_GENERATE` cheap, score→`MODEL_SCORE` strong), code-fence stripping, no-key-leak, and that live mode without a key raises.

## Decisions
- Provider = OpenRouter (OpenAI-compatible SDK), per PRD cost-routing. Models: Haiku for high-volume generation, Sonnet for scoring. Slugs configurable via env.

## Bug fixed (during live test)
- First live `POST /api/writing/evaluate` returned a raw **500** — gunicorn's default **30s worker timeout** killed the Sonnet scoring call (long examiner rubric runs longer). Raised the timeout to **120s** (`43ff495`); retried → clean 200.

## How to verify
- `cd api && .venv/Scripts/python -m pytest -q` → green (stub tests unaffected; new live tests pass with mocks, no network).
- Live: set `LLM_MODE=live` + `OPENROUTER_API_KEY` in `.env`, `docker compose up -d --build api`, `GET /api/health` → `{llmMode:"live", providerConfigured:true}`. Verified real calls: `POST /api/reading/generate {band:"B2"}` → real passage (Haiku); `POST /api/writing/evaluate` → real 4-criteria bands + CEFR + rewrite (Sonnet). Both HTTP 200, no `stub` flag.

## Caveats
- Real calls cost OpenRouter credits (cents-scale). `LLM_MODE=stub` keeps everything offline/free. OpenRouter slugs verified live on 2026-06-29 but can change — they're env-configurable.

## Commits
- `46ac998` feat(services): live OpenRouter LLM path (generate→MODEL_GENERATE, score→MODEL_SCORE)
- `b3a3cf2` fix(prompts): feed the task prompt into the writing scorer (Task Response)
- `43ff495` fix(api): raise gunicorn timeout to 120s for live LLM scoring
