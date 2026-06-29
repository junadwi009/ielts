# IELTS Coach v3 — Phase 1 Design (Offline/Stub Journey MVP)

> Design doc for the first sub-project of the v3 re-platform. Source of truth for product, journey,
> pedagogy, data, and UI is `tools/IELTS-Coach/{PRD-IELTS-Coach.md, PLACEMENT-TEST-BLUEPRINT.md, UI-UX-SPEC.md, ANALYSIS-NOTES.md}`.
> This doc scopes **Phase 1 only**: the guided journey running fully offline on stub fixtures.

| | |
|---|---|
| **Status** | Approved design → implementation plan next |
| **Date** | 2026-06-29 |
| **Owner** | Arjuna D. Putranto |
| **Phase** | 1 of N (offline/stub journey spine) |

---

## 1. Decisions locked (this session)

1. **Phased build.** Phase 1 = the offline journey MVP on `LLM_MODE=stub`. Later phases add live LLM routing, ASR, essay metrics, flashcards/lessons/history, full test suite, v1 import.
2. **Delete v1 entirely.** The existing Express + ESM + `node:sqlite` app is removed; v3 is built fresh in `ielts/`. v1's examiner prompts are reused as *reference* when authoring `services/prompts.py`.
3. **In-house UI primitives.** Small themed components in `web/src/components/ui/` — no Radix/shadcn, no runtime CDN. Full offline, token-driven.
4. **Dockerized `db` service.** Compose owns `postgres:18` + named volume; `docker compose up` is self-contained and does not touch the host's `:5432`.
5. **UI/UX defaults adopted:** brand Indigo `#4F46E5`, light-first with dark tokens defined, onboarding as a 3-step stepper, lucide icons, no emoji chrome. Tokens per UI-UX-SPEC §3–6.

---

## 2. Phase 1 scope

**In scope (offline, `LLM_MODE=stub`, zero network):**
- Guided journey: Welcome → Onboarding (name/goal/target) → Placement (1 of N combos, ~50-min timer, L→R→W→S) → Generating (loading) → Results (per-skill CEFR + radar + gap) → Program (30/90/180) → Milestones → enters app shell.
- App shell: sidebar (desktop) / bottom tabs (mobile); current-level chip per skill from `skill_levels`.
- Skill screens from the menu:
  - **Reading & Listening** — banded set from `generated_sets`, quiz UI, **local grading**.
  - **Writing & Speaking** — editor / recorder UI; in stub they return **fixture** band feedback (no real ASR/metrics yet).
  - **Tips** — static researched content (PRD §7).
  - **Progress** — placeholder shell (charts wired in a later phase).
- Stub LLM gateway returning banded fixtures; Alembic seeds 2 placement combos + 5 banded seed sets/skill.
- Docker Compose `web` + `api` + `db` boots fully offline.

**Out of scope (later phases):** live OpenRouter/Anthropic routing; faster-whisper ASR; essay-metric libs (language-tool-python, textstat, spaCy/TextDescriptives, LexicalRichness); flashcards SM-2 wiring; guided-lesson generation; history/trend charts; v1→Postgres import; full pytest/Vitest/Playwright suite (Phase 1 = smoke tests + secret scan only).

---

## 3. Architecture

Layering per PRD §8 (verbatim dependency rule):

```
Frontend ─▶ API (Flask + Pydantic) ─▶ App/Domain (services + domain) ─(Repository iface)─▶ Data (SQLAlchemy → Postgres)
- The browser NEVER sees any LLM key; all model calls go through services/llm.py.
- Routes call domain/services — never raw SQL or inline prompts.
- All prompts live in services/prompts.py; all persistence behind SQLAlchemy repositories.
- Frontend imports only shared API types.
```

### Folder structure
```
ielts/
  docker-compose.yml   .env.example   .gitignore   README.md
  web/
    Dockerfile  package.json  vite.config.ts  tsconfig.json  index.html
    src/app.css            # Tailwind v4 @theme tokens (UI-UX-SPEC §6)
    src/main.tsx  src/App.tsx
    src/lib/api/client.ts  # the ONLY HTTP boundary
    src/lib/types.ts       # mirrors Pydantic contracts
    src/lib/journey.ts      # journey state machine (which screen)
    src/components/ui/      # Button, Field, Card, Badge, Dialog, Toast, Timer, ProgressBar, LevelChip, QuizNavigator
    src/components/{welcome,onboarding,placement,results,program,milestones,
                   menu,reading,listening,speaking,writing,test,tips,progress}
    src/assets/fonts/      # Inter, Lexend, Atkinson Hyperlegible, OpenDyslexic (self-hosted)
  api/
    Dockerfile  requirements.txt  wsgi.py  alembic.ini
    app/__init__.py            # app factory, error envelope, CORS
    app/config.py              # env: LLM_MODE, DATABASE_URL, etc.
    app/routes/{health,onboarding,placement,practice,program,skills,tips,
               writing,speaking,reading,listening}.py
    app/schemas/               # Pydantic request/response models
    app/services/{llm.py, prompts.py}
    app/domain/{leveling,placement,program,scoring}.py
    app/data/{models.py, repositories.py, db.py}
    migrations/                # Alembic env + initial migration (+ seeds)
  fixtures/
    placement_combos.json      # 2 fully-built combos (items, keys, band_tags)
    seed_sets.json             # 5 banded sets/skill (reading, listening, writing, speaking)
    stub_responses.json        # keyed {task, skill, band} stub LLM payloads
    tips.json                  # researched per-section tips
  tests/                       # compose smoke + secret scan + a few domain unit tests
  docs/superpowers/specs/      # this doc
```

---

## 4. Data model (Phase 1 tables)

PostgreSQL 18 via SQLAlchemy 2.0 + Alembic. Tables created now and **exercised** in Phase 1:

| Table | Key fields | Notes |
|---|---|---|
| `user_profile` | id, name, goal∈{work,study_abroad,other}, target_band, skill_targets(jsonb), created_at | single row, modeled as a table |
| `skill_levels` | user_id, skill∈{listening,reading,writing,speaking}, band∈{A1A2,B1,B2,C1,C2}, updated_at | drives current-level badges |
| `placement_combos` | combo_id pk, version, target_minutes(=50), sections(jsonb) | seeded ×2 |
| `placement_items` | id, skill, band_tag, type, payload(jsonb), section_seconds, combo_id fk | seeded |
| `placement_attempts` | id, user_id, combo_id, started_at, duration_sec, per_skill(jsonb), overall_band, cefr, gap_to_target, created_at | one per sitting |
| `generated_sets` | id, skill, band, set_index∈1..5, payload(jsonb), source∈{seed,generated}, created_at | randomized on serve |
| `programs` | id, user_id, length_days∈{30,90,180}, start_date, status | one active |
| `milestones` | id, program_id fk, idx, day_target, title, targets(jsonb), achieved_at | per-skill targets |

Created by the same migration but **not exercised until later phases:** `attempts`, `mocks`, `lessons`, `cards`. (Defined now so the schema is stable.)

**Scoring (placement):** locator method from the blueprint — per band tier compute % correct, place at highest tier passed (≥⅔, monotonic), C1/C2 from a single anchor item corroborated by W/S. Raw→band table kept as a sanity cross-check. Overall = mean of 4 skill bands rounded to nearest 0.5. `gapToTarget = target_band − overall`.

---

## 5. API surface (Phase 1)

Uniform error envelope `{error:{code,message,details}}`; codes VALIDATION(422), NOT_FOUND(404), INTERNAL(500), LLM_UNAVAILABLE(502). Stub LLM/practice endpoints return fixtures with `"stub":true`.

- `GET  /api/health` → `{ok, llmMode, providerConfigured, asrReady:false}`
- `POST /api/onboarding` `{name,goal,targetBand,skillTargets?}` → user_profile
- `POST /api/placement/start` → `{comboId, sections[], targetMinutes:50}` (serves 1 of 2)
- `POST /api/placement/submit` `{comboId, answers, writingSamples, speakingText?}` → `{perSkill, overallBand, cefr, gapToTarget}`; writes `placement_attempts` + seeds `skill_levels`
- `POST /api/practice/generate` `{}` → `{jobId}` (stub: marks 5 seed sets/skill ready) · `GET /api/practice/status?jobId=` → `{done,progress}`
- `GET  /api/practice/set?skill=&band=` → a randomized set from `generated_sets`
- `POST /api/program` `{lengthDays}` → `{program, milestones[]}`
- `GET  /api/program/milestones` → `[{idx,dayTarget,title,targets}]`
- `GET  /api/skill-levels` → `[{skill,band}]`
- `GET  /api/tips/{skill}` → researched strategy content
- `POST /api/writing/evaluate` (stub) → bands+corrections+rewrite+cefr (fixture)
- `POST /api/speaking/evaluate` (stub) → bands+feedback+model answer+cefr (fixture)
- `POST /api/reading/generate` · `POST /api/listening/generate` (stub: return a banded fixture set)

All requests/responses validated by Pydantic; routes never return raw ORM rows.

---

## 6. Stub LLM gateway

`services/llm.py` exposes `LlmGateway` with `generate(task, skill, band, **kw)` and `score(task, **kw)`. `LLM_MODE=stub` (default) short-circuits to `fixtures/stub_responses.json` keyed by `{task,skill,band}`, returning `{"stub":true,...}` with zero network. The live path (OpenRouter via OpenAI SDK, `MODEL_GENERATE`/`MODEL_SCORE`; Anthropic fallback) is present as a stubbed branch behind the same interface and wired in Phase 2. All prompts authored now in `prompts.py` (so Phase 2 only flips the mode). Keys are read server-side only and never serialized into any response.

---

## 7. Frontend journey

A light journey state machine (`lib/journey.ts`, React Context) drives Zone A (focused, full-screen, linear: welcome→…→milestones) then hands off to Zone B (the app shell). HTTP only via `lib/api/client.ts`; types in `lib/types.ts` mirror the Pydantic contract. Tailwind v4 `@theme` tokens in `app.css`; `.dark` class swap; self-hosted fonts; lucide icons; Recharts for the results radar. Components map 1:1 to `src/components/<screen>` per UI-UX-SPEC §16. In-house `ui/` primitives are token-driven and a11y-first (focus ring, labels, `aria-live` timer, ≥44px targets, reduced-motion gating).

---

## 8. Verification (Phase 1 Definition of Done)

- `docker compose up --build` brings up `web`+`api`+`db`; `GET /api/health` → `{ok:true, llmMode:"stub"}`.
- Full journey walkable in the browser with **no outbound network**: welcome → onboarding → placement (timer, 1 of 2 combos, auto-submit on timeout) → generating → results (radar + per-skill CEFR + gap) → program → milestones → menu.
- Menu badges reflect placement `skill_levels`; Reading/Listening practice serves a banded set and grades locally; Writing/Speaking return stub feedback; Tips render.
- Persistence survives `docker compose down && up` (named volume).
- Compose smoke test passes; secret-scan finds zero keys; no LLM key in any browser-visible response.

---

## 9. Risks & mitigations (Phase 1)

- **R-1 Re-platform regression** `[High]` — building fresh, not porting line-by-line. Mitigation: stub-first journey spine, small domain unit tests (leveling vectors, placement scoring), carry v1 prompts as reference.
- **R-2 Scope creep into later phases** `[High]` — strict boundary in §2; ASR/metrics/live-LLM explicitly deferred.
- **R-3 Heavy api image / first-run downloads** `[Low in Phase 1]` — no whisper/spaCy/Java yet; the api image stays slim until Phase 2.
- **R-4 Docker/Postgres friction on Windows** `[Medium]` — db healthcheck + api retry + named volume; README quickstart.

---

## 10. Next step

Hand off to the **writing-plans** skill to produce the ordered, test-backed implementation plan for Phase 1 (scaffold compose → contracts → data+seeds → stub gateway → domain → API → journey UI → tips → smoke tests).
