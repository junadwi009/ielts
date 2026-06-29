# CLAUDE.md — project context for Claude Code

## What this is
A local, single-user IELTS prep web app. Backend proxies to the Anthropic Claude API so the API key never reaches the browser. Frontend is plain ES-module JS (no build step) for easy editing.

## Owner profile (drives priorities)
Arjuna — diagnostic: Reading **C1**, but Listening/Writing/Speaking **B1**. Goal: lift the three weak skills to ≥ 6.0 each (per-section minimum matters more than the average). Time allocation baked into the 30-day plan: Writing 35% · Listening 30% · Speaking 25% · Reading 10%.

## Architecture
- `server.js` — Express server; serves `public/` and exposes JSON endpoints.
- `src/claude.js` — thin Anthropic SDK wrapper (`askClaude`) + robust `parseJson`.
- `src/prompts.js` — ALL Claude prompts (examiner rubrics). Tune here to recalibrate strictness.
- `public/` — `index.html`, `styles.css`, and **per-feature ES modules** (no build step). `app.js` is just the entry point that imports them:
  - `core.js` (shared helpers: `$`, `api`, `apiGet`, `esc`, `bandBar`, `cefrBadge`, `norm`, `SR`, `synth`, `activateTab`, tabs + health), `results.js` (shared writing/speaking result renderers), `dashboard.js` (skill map, mocks, plan; exports `planDone`/`paintPlan`/`renderMocks`), `writing.js`, `speaking.js`, `listening.js`, `reading.js` (exports `readingBand`), `vocab.js`, `flashcards.js` (exports `refreshCardStats` + global "+ deck" handler), `pronounce.js`, `mock.js`, `progress.js`, `session.js` (exports `startSession`), `plan.js` (30-day plan + skill map data).
  - Note: `dashboard.js` ↔ `session.js` is an intentional circular import (safe — cross-calls fire at click-time, not load-time).
- **Quiz UI (`quizui.js`).** Reading, Listening and Mock share one quiz component: a progress bar + numbered question navigator with status (answered/correct/wrong) and a summary score card (`scoreCardHTML`); Mock uses `statCardsHTML` for its L/R/Overall summary. Question items carry `data-qi` so navigator chips can scroll to them. Patterns adapted from quiz-app reference designs.
- **Navigation (5 grouped tabs, not 10).** Top nav = 5 groups: Home, Practice, Vocab, Test, Progress. Every tool is a `.view` section; `core.js` maps views↔groups (`GROUP_OF`/`GROUP_DEFAULT`) and exposes `go(viewOrGroup)` (with `activateTab` as an alias). Navigate with `data-go="<viewId>"` on any element (hub cards, back links, Vocab Build/Review pills). Modules that need to load data when their view opens register `onView[viewId] = fn` (e.g. `onView.progress`, `onView.flashcards`). Home's "Today" hero (`renderToday` in `dashboard.js`) surfaces the next incomplete plan day with a one-click session start.
- `src/db.js` — persistence via Node's built-in `node:sqlite` (file `ielts.db`, git-ignored). Tables: `attempts`, `mocks`, `plan_progress`. Requires the `--experimental-sqlite` flag (already in the npm scripts). If `node:sqlite` is unavailable, it throws a clear message pointing to `better-sqlite3` as a fallback.
- Persistence (v2): Writing/Speaking attempts, mock scores, and 30-day plan progress live in `ielts.db`. The dashboard does a one-time import from old `localStorage` data on first load if the DB is empty.

## Endpoints
- `POST /api/writing/evaluate` {taskType, prompt, essay} → bands + corrections + rewrite
- `POST /api/writing/prompt` {taskType} → {prompt}
- `POST /api/speaking/evaluate` {part, question, transcript} → bands + feedback + model answer
- `POST /api/speaking/question` {part} → {question}
- `POST /api/vocab` {topic} → {words:[...]}
- `POST /api/listening/generate` {level?, topic?} → {title, transcript, questions:[...]}
- `POST /api/reading/generate` {level?, topic?} → {title, passage, questions:[...]}
- `POST /api/lesson/generate` {day?, focus, tasks[], level?} → a guided micro-lesson {goal, skill, warmup, teach, exercises[], produce, review} (powers the dashboard "Start session" flow). Cached per `day` in the `lessons` table: returns the saved lesson instantly unless `?force=1` (Regenerate) is passed.
- `GET  /api/lesson/:day` → {lesson, focus, created_at} the cached lesson for a plan day, or {lesson:null} if not generated yet.
- `POST /api/writing/upgrade` {taskType, essay} → {upgrades:[{original,upgraded,reason}], upgradedEssay} — Grammarly-style C1 elevation (distinct from band evaluation).
- `POST /api/pronounce/sentence` {level?, topic?} → {text, focus, tips[]} — read-aloud target.
- `POST /api/pronounce/feedback` {target, transcript, accuracy, missed[]} → {summary, wordTips[], prosody[]}.
- Flashcards (SM-2, no Claude): `GET /api/cards` (+stats), `GET /api/cards/due`, `POST /api/cards` (single or {cards:[...]}), `POST /api/cards/:id/review` {quality 0-5}, `DELETE /api/cards/:id`.
- Writing & Speaking eval JSON now also include a `cefr` field (A2–C2), shown as a coloured badge (Write & Improve style). Speaking eval adds `vocabUpgrades` (your word → C1).
- `GET  /api/health` → {ok, keyConfigured}
- Persistence (no Claude): `GET /api/history/attempts?type=writing|speaking`, `GET /api/history/attempt/:id`, `GET /api/stats/trends`, `GET|POST /api/mocks`, `GET|POST /api/plan/progress`. Writing/Speaking evaluations auto-save to `attempts` and return a `savedId`.

## Seed content (zero-API first run)
Every content generator shows a static sample on load so opening the app costs no Claude API credit. Samples live in `public/seed.js` (Writing prompt, 3 Speaking questions, Listening set, Reading passage, Pronounce sentence, Vocab list); each module renders the seed via the same render function it uses for API results. The Day-1 guided lesson is in `src/seed.js` and seeded into the `lessons` table on boot (`server.js`) if absent. Only the Generate/Regenerate buttons (and the evaluation endpoints) call the API. To re-apply the seed on an existing install, delete `ielts.db`.

## Conventions
- ESM everywhere (`"type":"module"`). Keep prompts in `src/prompts.js`. Always return strict JSON from Claude and parse with `parseJson`.
- Keep the frontend dependency-free (no React/build) unless a feature truly needs it.

## Pedagogy (guided sessions)
Each 30-day plan day has a **Start session** button that opens a guided lesson (modal in `public/index.html` `#sessionModal`, runner in `app.js`). The lesson is NOT a test — it follows an evidence-based **Teach → Practice → Produce → Review** flow (PPP + task-based hybrid, deliberate practice): one measurable goal, comprehensible-input teaching (i+1), 4-6 auto-checked exercises with *immediate* feedback (~85% target success), a pushed-output production task that hands off (prefilled) to the matching skill tab, and a review surfacing collocations to retain (spaced retrieval). Tune the lesson prompt in `genLesson` (`src/prompts.js`). Finishing a session can tick the day's tasks complete. **Lessons are cached per day** in the `lessons` table — the first Start generates (~20-60s) and saves it; re-opening is instant and identical. The modal's **↻ Regenerate** button forces a fresh lesson (`?force=1`) and overwrites the cache.

## Roadmap (suggested order)
1. ✅ **Listening module** — Claude generates a transcript + 6-8 questions; browser SpeechSynthesis reads it aloud (TTS stand-in for real audio); answers graded locally then transcript revealed with answers highlighted. (`genListening`, `POST /api/listening/generate`)
2. ✅ **Reading module** — Claude generates a 700-900 word passage + 10-13 questions (emphasis on TFNG / Matching Headings) with explanations; graded locally with an approximate raw→band map and optional 20-min timer. (`genReading`, `POST /api/reading/generate`)
3. 〰️ **Pronunciation scoring** — Pronounce tab (read-aloud): Web Speech recogniser gives an *approximate* word-match accuracy + highlights missed words, then Claude gives stress/intonation/word tips. NOTE: this is an approximation (ELSA-style), not true phoneme scoring — a real speech API (e.g. Azure Pronunciation Assessment) would be the upgrade.
4. ✅ **Persistence** — `node:sqlite` (built-in, `ielts.db`) stores essays, speaking attempts, mock scores, and plan progress; survives restarts. (`src/db.js`)
5. ✅ **Spaced repetition** — Flashcards tab with SM-2 scheduling (`cards` table). Fed from Vocab ("+ deck" / Add all), Speaking vocab upgrades, session review, or manual/article add. Review flips card → grade Again/Hard/Good/Easy → auto-reschedule. (Magoosh/Anki adaptation)
6. ✅ **History & analytics** — Progress tab with Chart.js trend lines (Writing/Speaking overall + per-criterion, mocks over time) and a clickable history that re-opens past feedback. (`GET /api/stats/trends`, `/api/history/*`)
7. **Deploy** — optional: containerise and host privately; add a simple passcode.

## Testing
`npm start` (runs `node --experimental-sqlite server.js`), open http://localhost:5050. `GET /api/health` should return `{ok:true}`. Claude endpoints need a valid `ANTHROPIC_API_KEY` in `.env`. To check persistence: evaluate a Writing/Speaking answer, restart the server, open the Progress tab — the attempt, charts, and history should still be there.
