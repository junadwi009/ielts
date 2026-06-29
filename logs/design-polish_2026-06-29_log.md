# design-polish — 2026-06-29

Made the v3 UI feel premium instead of "kaku" (stiff). Applied the `redesign-existing-projects` skill as a calm, premium system-polish across two passes, plus self-hosted fonts + a code-split, plus two cosmetic fixes. No framework migration; no functional/test changes.

## Why
Owner feedback: the UI looked stiff. Root cause (diagnosed live in Chrome): flat low-contrast surfaces, default-weight type with no scale, blocky full-width buttons, zero motion, brand barely used, over-empty composition. The tokens (Indigo brand, Inter/Lexend) were right; the *execution* was under-developed.

## What changed
**Fonts + perf (`c76c0e7`)**
- Self-hosted fonts via `@fontsource` (Inter, Lexend, Atkinson Hyperlegible, OpenDyslexic) — no runtime CDN; `web/src/fonts.css` imported in `main.tsx`.
- Code-split the Results screen (lazy `import`) so recharts is its own chunk: **main bundle 630 kB → 263 kB**; recharts (367 kB) loads only at the results step.

**Polish pass 1 (`73d40ac`)** — primitives + most-seen screens
- `app.css` @theme: tinted elevation scale (`--shadow-e1/e2/e3`), radius tokens, motion, type-scale base styles, ambient radial wash for journey screens.
- Primitives: Button (intrinsic width + hover/active scale + 180ms transition + proper disabled), Card (elevation + hover-lift), RadioCard, Field/Textarea, StepIndicator (filled active circle + connecting line), Badge/LevelChip.
- Welcome (brand mark + wordmark, display heading, capped CTA, text-link secondary), Onboarding, Results (radar + skill cards, tabular-nums).

**Polish pass 2 (`c250f40`)** — remaining screens + disabled-button fix
- Placement runner (TestFrame chrome, QuizNavigator chips, Lexend passage), app shell (branded Sidebar active state, BottomTabs), Home (Today hero card, elevated skill cards, milestone bar), skill screens (QuizRunner score card, Writing/Speaking feedback, Tips accordions, Progress empty-state), Generating loader, Program (recommended-tier emphasis), Milestones (filled stepper). Cleaned the washed-out disabled button.

**Cosmetic (`30fef9e`)** — Tips content left-aligned to match the rest of the app (was centered → looked right-leaning); removed a redundant `border-l-4` class on the Today card.

## How to verify
- `cd web && npm test` → 14 passed; `npx tsc --noEmit` clean; `npm run build` OK (chunks: main ~263 kB + lazy Results/recharts ~367 kB).
- Visual (active Chrome, `docker compose up -d --build web`, http://localhost:5173): Welcome, Onboarding, Dashboard/app shell, and Tips all confirmed premium — elevation/depth, type presence, motion, brand mark, intrinsic buttons.

## Caveats / notes
- Reduced-motion (`prefers-reduced-motion`) still disables all the added transitions.
- Honors the locked `tools/IELTS-Coach/UI-UX-SPEC.md` system (Indigo + Inter/Lexend) — fixed execution, not tokens. No parallax/grain/glassmorphism (calm study-app intent).
- Tooling note (same session): the recommended Claude Code extension set is already installed (superpowers, security-guidance, atomic-commits, taste/design skills, built-in /code-review); ui-ux-pro-max/ECC/gstack deliberately skipped (conflicts).

## Commits
- `c76c0e7` perf(web): self-host fonts via @fontsource; code-split recharts/Results
- `73d40ac` style(web): premium design-polish pass — elevation, type scale, motion, brand, button sizing
- `c250f40` style(web): design-polish pass 2 — placement, app shell, skill screens, program/milestones; fix disabled button
- `30fef9e` style(web): left-align Tips content with the app; drop redundant Today border class
