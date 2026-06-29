# Update Log — Shared quiz UI (from reference designs)
**Date:** 2026-06-15
**Type:** UI — apply quiz-app patterns from 3 reference screenshots.

## References studied → what was used
- **Ref 2 (MDQuiz):** progress bar + numbered question **navigator with status** (answered/correct/wrong) + a **score card**. → Used for Reading & Listening.
- **Ref 3 (Summary):** **stat cards** for a multi-metric summary. → Used for Mock (Listening / Reading / Overall band).
- **Ref 1 (vertical onboarding stepper):** already matches the existing Session modal stepper → left as-is (noted for a future polish).

## What changed
New shared module **`public/quizui.js`** (anti-redundant — one component, three consumers):
- `quizHeader(headerEl, n, scopeEl)` — progress bar + numbered chips; clicking a chip scrolls to `[data-qi]`.
- `quizUpdate(headerEl, answered[])` — live bar + "X of N answered" + chips turn blue when answered.
- `quizResults(headerEl, results[])` — chips turn green (correct) / red (wrong) after grading.
- `scoreCardHTML(score, total, band?)` — hero "% / you got X/Y correct · ~Band".
- `statCardsHTML(cards[])` — row of summary cards.

Integrated:
- `index.html` — added `#rHead` / `#lHead` quiz-header containers; question items got `data-qi`.
- `reading.js`, `listening.js` — render the navigator, live-update as you answer, colour chips + show the score card on Check.
- `mock.js` — results now show 3 stat cards (L / R / Overall band) and also save the overall band to the tracker.
- `styles.css` — `.quizhead/.quizbar/.qnav/.qchip(.answered/.correct/.wrong)`, `.scorecard`, `.statcards/.statcard`.

## How to test (verified in the user's Chrome, zero API — used seed content)
- Reading (seed): 11 numbered chips; progress went 0→11 as answers were selected; bar to 100%; Check → score card "18% · 2/11 · Band 4"; chips coloured 2 green / 9 red.
- Listening (seed, mixed note + mcq): 7 chips; partial "2 of 7 answered" after one text + one radio; Check → score card; all chips coloured.
- Zero console errors.
- Mock: reuses `statCardsHTML` + previously-verified grading (not re-run here to avoid API cost).

## Notes
- All verification used the pre-seeded content, so this change cost no Claude API.
- Ref 1's stepper maps to the existing Session modal; can be upgraded to a vertical checkmark stepper later if wanted.
