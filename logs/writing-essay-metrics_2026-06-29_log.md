# writing-essay-metrics — 2026-06-29

Phase 2b-1: deterministic essay-quality metrics on Writing evaluation, supporting (not replacing) the LLM examiner band.

## What changed
- **`api/app/services/essay_metrics.py`** (new) — `compute_metrics(essay)` returns readability (textstat: Flesch reading-ease, Flesch-Kincaid grade, Gunning Fog), lexical diversity (LexicalRichness: TTR, MTLD), and syntax (spaCy + TextDescriptives: mean sentence length, mean dependency distance, long-word count). spaCy pipeline loaded once as a module singleton; degrades to `syntax: null` (never raises) if the model/libraries are unavailable; empty/short input returns zeros/None.
- **`api/app/routes/writing.py`** — computes metrics, passes a `metricsSummary` line into the scorer, attaches `metrics` to the response (in both stub and live modes).
- **`api/app/services/prompts.py`** — writing scorer template gets a `{metricsSummary}` reference block ("for your reference only — do not let them override your judgement").
- **`api/requirements.txt`** — added `textstat` (0.7.13), `lexicalrichness` (0.5.1), `spacy` (3.8.14), `textdescriptives` (2.8.2). Pin bumps were needed for Python 3.13 wheel availability (textstat 0.7.4 used removed `pkg_resources`; spacy 3.8.2 had no cp313 wheel).
- **`api/Dockerfile`** — `RUN python -m spacy download en_core_web_sm` bakes the model into the image (offline). Image grows ~+350 MB for the spaCy/numpy stack.
- **`web/src/lib/types.ts`** + **`web/src/components/writing/Writing.tsx`** — `EssayMetrics` type + a metrics panel in the Writing feedback view (stat cards, tabular-nums), labelled as supporting metrics.
- **Tests:** `api/tests/test_essay_metrics.py` (7 tests incl. a regression guard that syntax must populate when the model is present).

## Decisions
- NO language-tool-python / NO Java — grammar stays the LLM's job (keeps the image lean + fully offline). Whisper ASR (model `base`) is the next staged piece (Phase 2b-2), not in this update.

## Bug fixed (same batch)
- `syntax` came back **null in the container** though it worked in the venv: `essay_metrics` called `nlp.add_pipe("textdescriptives/…")` without `import textdescriptives`, so the spaCy factories were never registered (`E002`). Fixed by importing textdescriptives inside the singleton loader before `add_pipe`; added a regression test that does NOT import textdescriptives itself (so only the module can register the factories).

## How to verify
- `cd api && .venv/Scripts/python -m pytest -q` → 57 passed. `cd web && npm test` → 14 passed; `npx tsc --noEmit` clean; `npm run build` OK.
- Live (LLM_MODE=live + OPENROUTER_API_KEY): `docker compose up -d --build api`; `POST /api/writing/evaluate {taskType,prompt,essay}` returns `bands`+`cefr` (Sonnet) AND `metrics` with non-null `readability`, `lexicalDiversity`, and `syntax`. Verified in container: syntax = {meanSentenceLength 15.5, meanDependencyDepth 2.79, nLongWords 26}.

## Caveats / known limits
- **MTLD is unreliable on short essays** (<~150 words) — it reported ~215 on a 70-word sample. It's meaningful at real Task-2 length (250+ words). Not capped/fixed.
- spaCy cold-starts on the first scoring request (~0.5s), then reuses the singleton.

## Commits
- `e16e4f6` feat(writing): essay-quality metrics
- `94fc997` fix(metrics): import textdescriptives so its spaCy factories register + regression test
