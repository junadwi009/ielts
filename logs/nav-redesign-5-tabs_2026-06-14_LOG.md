# Update Log — Navigation & user-journey redesign
**Date:** 2026-06-14
**Type:** UX / information-architecture redesign (no backend change)

## Why
The top nav had **10 tabs** — chaotic. UX research says keep primary nav to **3–5 items** (NN/g; 4 is the sweet spot), label icons, and give the home screen one clear "what now?" action (Duolingo pattern).

## What changed
Collapsed 10 flat tabs → **5 grouped sections**, with a card-based Practice hub and a journey-driving Home.

### New IA (5 top tabs)
| Tab | Contains |
|---|---|
| 🏠 Home | **Today hero** (next plan day + "Start today's session" CTA + progress bar), skill map, mock tracker, 30-day plan |
| ✏️ Practice | Hub of 5 cards → Writing / Speaking / Listening / Reading / Pronounce (each opens with a "← Practice" back link) |
| 📚 Vocab | Build / Review pill toggle (vocab generator ↔ flashcards) |
| 📝 Test | Mock simulation |
| 📈 Progress | Charts + history |

### How it works (kept simple, no build step)
- Every tool is now a `.view` section (was `.tab`). A "group" = a top-nav button; `GROUP_OF`/`GROUP_DEFAULT` maps views↔groups in `core.js`.
- `go(viewOrGroup)` shows one view and highlights its group. `activateTab` is now an alias of `go` (session handoff still works).
- Navigation via `data-go="<view>"` on hub cards, back links, and Vocab pills (one delegated click handler).
- New `onView` registry: modules run a hook when their view opens — `onView.progress = loadProgress`, `onView.flashcards = refreshCardStats`. (Replaces the old per-button listeners; the removed `data-tab="flashcards"` button would otherwise have crashed.)
- Home "Today" card (`dashboard.js renderToday()`) finds the first incomplete plan day and offers a one-click session start.

### Files
- `public/index.html` — rebuilt nav + views (all inner IDs preserved), added `#practiceHome` hub, Vocab pills, back links, Today hero.
- `public/core.js` — grouped nav system + `onView` registry + `data-go` delegation.
- `public/dashboard.js` — `renderToday()` hero (called from `paintPlan`).
- `public/progress.js`, `public/flashcards.js` — use `onView` hooks instead of removed nav buttons.
- `public/styles.css` — `.tab`→`.view`; new `.hero/.today-*`, `.hub/.hubcard`, `.subnav/.pill`, `.back`.

## How to test (verified in the user's Chrome)
1. `npm start` → http://localhost:5050.
2. Nav shows 5 tabs. Home shows the Today hero with a Start CTA.
3. Practice → 5 hub cards → open one → "← Practice" returns. Nav stays on Practice.
4. Vocab → Build/Review pills switch views; Review refreshes due count.
5. Test → mock; Progress → charts load on open.
6. Today CTA opens the guided session. Zero console errors throughout.

## Caveats
- Pure front-end IA change; all tools, endpoints, and data untouched.
- `activateTab` retained as an alias so existing modules keep working.
