# IELTS Coach — v3 Phase 1 rebuild (2026-06-29)

## What this was
Total re-platform of the `ielts/` app from v1 (vanilla ESM + Express + node:sqlite) to **v3**:
React 19 + TypeScript + Vite + Tailwind v4 frontend · Flask 3.1 + Pydantic + SQLAlchemy 2 + PostgreSQL 18 backend · Docker Compose · **offline-first** (`LLM_MODE=stub`, zero network).
Driven by `tools/IELTS-Coach/{PRD,PLACEMENT-TEST-BLUEPRINT,UI-UX-SPEC,ANALYSIS-NOTES}.md`.

## Decisions (this session)
- Phased build; Phase 1 = the offline/stub guided journey MVP (later phases: live OpenRouter LLM, faster-whisper ASR, essay-metric libs, flashcards, history charts, v1 import).
- v1 deleted; v3 built fresh in `ielts/`.
- In-house UI primitives (no Radix/shadcn). Dockerized `db` service (postgres:18). Brand Indigo, light-first + dark tokens, 3-step onboarding, lucide icons.

## Process
Spec → plan → subagent-driven execution: 22 planned tasks, each a fresh implementer subagent (TDD) + controller review, then a whole-branch review (opus) + a fix pass. Design doc: `docs/superpowers/specs/2026-06-29-ielts-v3-phase1-design.md`; plan: `docs/superpowers/plans/2026-06-29-ielts-v3-phase1.md`.

## What shipped (23 commits, df909d3..3b85cd4)
- Backend: app factory + error envelope + health; 12 SQLAlchemy models + Alembic; repositories; Pydantic contracts; fixtures + seed (2 placement combos, 5 banded sets/skill, stub LLM responses, tips); domain — CEFR leveling, locator placement scoring, programs/milestones; stub LLM gateway + centralized prompts; routes — onboarding, placement, skill-levels, practice, program, tips, reading/listening/writing/speaking.
- Frontend: Vite+Tailwind v4 scaffold + tokens + typed API client; in-house UI primitives; journey state machine; Welcome, Onboarding, Placement runner (timed L/R/W/S), Generating, Results (radar), Program, Milestones, app shell (sidebar/bottom tabs + Home + level chips), skill screens (QuizRunner local grading, Writing/Speaking stub, Tips, Progress).
- Verification: `tests/smoke.sh`, `tests/secret_scan.sh`, README.

## Verification (real)
- pytest **44/44**, vitest **14/14**, `tsc --noEmit` exit 0, secret scan clean.
- **`docker compose up` smoke = SMOKE OK on this machine** (health=stub, placement/start, tips). Fixed during smoke: postgres:18 volume path (`/var/lib/postgresql`), api fixtures bind-mount, `.dockerignore` files.
- Whole-branch review (opus): 0 Critical, 2 Important (fixed: Pydantic output models + PerSkill.assessed; toast 44px), 4 Minor.

## Accepted Phase-1 deferrals (fast-follows, not defects)
Self-hosted fonts (system-ui fallback for now) · recharts bundle code-split · lenient phone-number grading · web Dockerfile `npm ci`/prod build · **live LLM routing, faster-whisper ASR, essay-metric libs, flashcards, history charts, v1→Postgres import** (whole later phases).

## Run it
`cp .env.example .env && docker compose up --build` → http://localhost:5173 (api :5050). `LLM_MODE=stub` = fully offline.
