# Update Log — Seed content (zero-API first run)
**Date:** 2026-06-15
**Type:** Feature — static starter content so first use costs no API credit.

## Why
The user wanted every tool pre-filled with a "first question" on load, so opening the app spends no Claude API saldo. Fresh content is fetched only when they click Generate/Get/Regenerate.

## What changed
- **`public/seed.js`** (new) — static sample content: 1 Writing prompt, 3 Speaking questions (Part 1/2/3), 1 Listening set (~260-word convo + 7 Q), 1 Reading passage (~760 words + 11 Q with explanations), 1 Pronounce sentence, 1 Vocab list (10 items).
- **`src/seed.js`** (new) — `SEED_LESSON_DAY1`, a full guided lesson; `server.js` seeds it into the `lessons` table on boot if Day 1 has no cached lesson. So the Home "Today" CTA opens a real lesson with no API call.
- Each tool now renders its seed on load and reuses one render function for both the seed and the API path:
  - `writing.js` — fills the prompt box.
  - `speaking.js` — `showSeedQuestion()` per selected part.
  - `listening.js` — extracted `renderListeningQuestions()`; seeds `lData` (press Play to hear; no autoplay).
  - `reading.js` — extracted `renderReading()`; seeds `rData`.
  - `pronounce.js` — `showSeedSentence()`.
  - `vocab.js` — extracted `renderVocab(words, topic)`; seeds the list + topic.
- The existing Generate/Get/Regenerate buttons are unchanged — they fetch fresh content (this is the only path that uses the API).

## How to test (verified in the user's Chrome)
1. Reset DB (`rm ielts.db`) so the seed applies, then `npm start`.
2. Full page reload made **only 4 GET requests** — `/api/health`, `/api/cards`, `/api/mocks`, `/api/plan/progress` (all cheap DB/health). **No** `/generate`, `/evaluate`, `/upgrade`, `/vocab`, or lesson-generation calls.
3. Every tool shows content: Writing prompt, Speaking question, Listening (7 Q), Reading "The Quiet Revolution of Urban Green Spaces" (11 Q), Pronounce sentence, Vocab (10 words). `GET /api/lesson/1` returns the seeded Day-1 lesson.

## Notes / caveats
- Evaluation endpoints (writing/speaking evaluate, writing upgrade, pronounce feedback) still use the API when invoked — they grade *your* input and can't be pre-seeded. The seed covers all *content generation*.
- To get a clean seeded state on an existing install, delete `ielts.db` once (it's git-ignored) so the Day-1 seed lesson is inserted.
- Editing the samples is easy: `public/seed.js` (tools) and `src/seed.js` (Day-1 lesson).
