# Update Log — Conventions + React/Flask study
**Date:** 2026-06-14
**Type:** Process change + architecture analysis (no app code changed)

## What changed
1. **New convention — update logs.** From now on, every update produces `logs/{update}_{date}_LOG.md` summarizing changes, why, how to test, caveats. (This file is the first.)
2. **New convention — preview in active browser.** Verification now uses the user's own Chrome at http://localhost:5050 (Claude-in-Chrome / computer-use), not the headless preview MCP.
3. Both saved to project memory so they persist across sessions.

## Current architecture (surveyed)
Backend (Node + Express, ESM):
- `server.js` (189 lines) — 25 endpoints, thin wrappers around `run(res, builder, maxTokens, afterParse)` (Claude) or direct DB calls.
- `src/claude.js` (23) — Anthropic SDK + `parseJson`.
- `src/prompts.js` (182) — 11 prompt builders (the real "IP"): writingEval, speakingEval, genWritingPrompt, genSpeaking, genListening, genReading, genLesson, writingUpgrade, genPronounce, pronounceFeedback, vocabBuilder.
- `src/db.js` (226) — node:sqlite (`--experimental-sqlite`); tables: attempts, mocks, plan_progress, lessons, cards (SM-2).

Frontend (vanilla ES modules, NO build step):
- `public/app.js` (909 lines) — all UI/fetch/state. ← largest complexity hotspot.
- `public/index.html` (269), `public/styles.css` (81), `public/plan.js` (46).

## React + Flask — assessment & recommendation

### Flask (replace Express) — NOT recommended now
- The Node backend is thin and works; porting 25 endpoints + 11 prompts to Python is busywork for ~0 functional gain.
- Costs the current single-language (all-JS) simplicity; adds a Python runtime on Windows.
- ONLY justified if we add **Python-only capabilities** — most relevantly **real pronunciation scoring / audio ML** (the ELSA gap), where Python libs (or Azure Speech SDK) shine. Even then a *small Python microservice for audio only* beats a full rewrite.

### React (replace vanilla JS) — defensible, with a tradeoff
- Pro: `app.js` is 909 lines and growing; React would tame per-tab state (seState, mkData, fcQueue, planDone…), give reusable components (result card, question item, flashcard, modal), and `react-chartjs-2` for Progress.
- Con: introduces a **build step** (Vite + node_modules), breaking the current "edit a file, refresh" ease that CLAUDE.md explicitly values — and adds learning overhead while the user is still learning to code.

### Recommended paths (in order of value-for-effort)
1. **Refactor only (no new tooling):** split `app.js` into per-feature ES modules (`writing.js`, `speaking.js`, `flashcards.js`, `mock.js`, `session.js`, …). ~70% of the maintainability win, 0 build step, easiest to learn. **Best default.**
2. **React frontend + keep Express backend (React+Vite):** do this if the goal is to *learn React* (portfolio value). Common, learnable stack. Keep Node — don't switch to Flask.
3. **Full React + Flask rewrite:** only if you specifically want Python AND React. Highest effort, largest rewrite, most to learn at once.
4. **Keep as-is.**

**My pick:** Path 1 now; Path 2 later if you want React for its own sake; Flask only when real audio/ML scoring is on the table.

## How to test
N/A — no app code changed. App still runs via `npm start` → http://localhost:5050.

## Caveats
- Decision on migration is pending the user's choice (asked).
