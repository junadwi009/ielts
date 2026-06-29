# IELTS Coach v3

A self-hosted IELTS preparation app with AI-powered Writing, Speaking, Listening, and Reading practice.

## Quickstart

```bash
cp .env.example .env
docker compose up --build
```

Open **http://localhost:5173** in your browser.

## Notes

- Band scores are **estimates only** — not official IELTS scores. Verify with a real mock from British Council or IDP.
- `LLM_MODE=stub` (the default) runs fully **offline** using static fixture data — no API key required. Ideal for development and testing.
- **Phase 1 = offline stub journey.** Live LLM calls, ASR (speech recognition), and real scoring metrics come in later phases.
- API keys are server-side only and must never be committed. Add your keys to `.env` (git-ignored) only.

## Architecture

| Service | Path | Description |
|---------|------|-------------|
| `api` | `./api` | Python FastAPI backend |
| `web` | `./web` | Frontend (Vite) |
| `db` | Docker | PostgreSQL 18 |

See `CLAUDE.md` for full architecture, conventions, and roadmap.
