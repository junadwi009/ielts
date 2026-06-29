# Update Log — Frontend modular refactor
**Date:** 2026-06-14
**Type:** Refactor (no behaviour change). Chosen path: keep Node/Express + vanilla JS, no build step.

## What changed
Split the monolithic `public/app.js` (909 lines) into a 17-line entry point + 13 focused ES modules. Each feature now lives in its own file — "want to change Writing? open writing.js".

### New structure (public/)
| File | Lines | Responsibility |
|---|---|---|
| `app.js` | 17 | Entry point — just imports the modules in order |
| `core.js` | 58 | Shared helpers ($ , ls, api, apiGet, esc, bandBar, cefrBadge, norm), browser speech refs (SR, synth), tab switching, health check |
| `results.js` | 38 | Shared `writingResultHTML` / `speakingResultHTML` |
| `dashboard.js` | 98 | Skill map, mock tracker, 30-day plan; exports `planDone`, `paintPlan`, `renderMocks` |
| `writing.js` | 47 | Writing coach (prompt, evaluate, ✨ Upgrade) |
| `speaking.js` | 63 | Speaking coach (questions, mic, cue-card timer, evaluate) |
| `listening.js` | 65 | Listening coach (TTS + local grading) |
| `reading.js` | 76 | Reading coach; exports `readingBand` |
| `vocab.js` | 24 | Vocabulary builder + add-to-deck |
| `flashcards.js` | 92 | SM-2 deck; exports `refreshCardStats`; owns the global "+ deck" handler |
| `pronounce.js` | 54 | Read-aloud pronunciation (browser speech) |
| `mock.js` | 90 | Mock test simulation |
| `progress.js` | 71 | Chart.js trends + history re-open |
| `session.js` | 173 | Guided session modal; exports `startSession` |

### Dependency notes (for learning)
- Everything imports shared helpers from `core.js`.
- `dashboard.js` ↔ `session.js` is a deliberate circular import (dashboard's plan buttons call `startSession`; session's finish mutates `planDone`/`paintPlan`). Safe because the cross-calls happen at click-time, not at module load.
- `mock.js` reuses `readingBand` (reading.js) + `renderMocks` (dashboard.js) — no duplicated logic.
- `index.html` unchanged: still loads `<script type="module" src="app.js">`; app.js pulls in the rest.

## How to test
`npm start` → http://localhost:5050. Verified in the user's Chrome:
- All 10 tabs + sections present; dashboard renders (30 days, 30 Start-session buttons, skill map, mock tracker).
- Zero console errors on load and after interaction.
- Flashcards add works (stats update).
- Dashboard → Start session opens the modal (exercises the circular import).

## Caveats
- Pure refactor — no features added or changed.
- ES modules require serving over http (already the case); opening index.html via file:// would break imports.

## Process
- Established earlier this session: update logs (this file) + verify in active browser. Both applied here.
