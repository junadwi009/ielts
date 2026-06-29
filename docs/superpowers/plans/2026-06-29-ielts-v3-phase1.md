# IELTS Coach v3 — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the offline/stub guided journey for IELTS Coach v3 (Welcome → Onboarding → Placement → Generating → Results → Program → Milestones → app-shell menu) running fully locally via `docker compose up` with `LLM_MODE=stub` and zero outbound network.

**Architecture:** Four layers per `docs/superpowers/specs/2026-06-29-ielts-v3-phase1-design.md` §3 — React 19 SPA (Vite 8 + Tailwind 4) → Flask 3.1 REST (Pydantic-validated, uniform error envelope) → app/domain services (leveling, placement scoring, program, LLM gateway) → SQLAlchemy 2.0 repositories over PostgreSQL 18. All LLM access goes through `services/llm.py`; in stub mode it returns fixtures with no network. The browser never sees a key.

**Tech Stack:** React 19.2, TypeScript 5, Vite 8.1, Tailwind CSS 4.3, lucide-react, Recharts · Flask 3.1, Gunicorn 23, Pydantic v2, SQLAlchemy 2.0, Alembic, psycopg 3 · PostgreSQL 18 · Docker Compose v2 · pytest, Vitest.

## Global Constraints

- **Offline-first:** `LLM_MODE=stub` is the default; the entire journey MUST work with zero outbound network. No runtime CDN — fonts/icons self-hosted.
- **Keys server-side only:** no LLM/OpenRouter/Anthropic key may appear in any browser-visible response or frontend bundle.
- **Layer rule:** routes call domain/services only — never raw SQL, never inline prompts. All prompts live in `api/app/services/prompts.py`. All persistence behind SQLAlchemy repositories. Frontend talks HTTP only via `web/src/lib/api/client.ts`.
- **Contracts:** every request/response validated by Pydantic; routes return Pydantic models, never raw ORM rows. Error envelope: `{"error":{"code","message","details":[]}}` with codes VALIDATION(422), NOT_FOUND(404), LLM_UNAVAILABLE(502), INTERNAL(500).
- **CEFR bands** are the 5-value enum `{A1A2, B1, B2, C1, C2}`. Skills are `{listening, reading, writing, speaking}`. Goals are `{work, study_abroad, other}`. Program lengths are `{30, 90, 180}`.
- **Versions** pinned in §Global per design; re-verify on scaffold. Python 3.13, Node 22, postgres:18.
- **Honesty:** bands/levels are labeled estimates in UI/README.

---

## Task 1: Scaffold repo, Docker Compose, git

**Files:**
- Delete: all existing v1 files in `ielts/` EXCEPT `docs/`, `CLAUDE.md`, and `tools/` references (v1: `server.js`, `src/claude.js`, `src/*.js`, `public/`, `package.json`, `package-lock.json`, `node_modules/`, `ielts.db`, `.env.example`)
- Create: `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md`
- Create (empty dirs with `.gitkeep`): `web/`, `api/`, `fixtures/`, `tests/`

**Interfaces:**
- Produces: compose services `web` (port 5173), `api` (port 5050), `db` (postgres:18, internal). Env contract in `.env.example`.

- [ ] **Step 1: Remove v1**

```bash
cd ielts
# keep docs/ and CLAUDE.md; remove v1 app
rm -rf node_modules public src server.js package.json package-lock.json ielts.db .env .env.example
```

- [ ] **Step 2: git init**

```bash
cd ielts
git init
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
__pycache__/
*.pyc
.env
.venv/
web/dist/
*.db
.pytest_cache/
```

- [ ] **Step 4: Write `.env.example`**

```
# LLM_MODE=stub runs fully offline with fixtures (default). live wired in Phase 2.
LLM_MODE=stub
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
MODEL_GENERATE=
MODEL_SCORE=
# DB: compose db service owns this; override only to use host :5432
DATABASE_URL=postgresql+psycopg://ielts:ielts@db:5432/ielts
API_PORT=5050
WEB_PORT=5173
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 5: Write `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: ielts
      POSTGRES_PASSWORD: ielts
      POSTGRES_DB: ielts
    volumes:
      - ielts_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ielts"]
      interval: 5s
      timeout: 3s
      retries: 10
  api:
    build: ./api
    env_file: .env
    environment:
      DATABASE_URL: postgresql+psycopg://ielts:ielts@db:5432/ielts
    ports:
      - "${API_PORT:-5050}:5050"
    depends_on:
      db:
        condition: service_healthy
  web:
    build: ./web
    ports:
      - "${WEB_PORT:-5173}:5173"
    environment:
      VITE_API_BASE: http://localhost:${API_PORT:-5050}
    depends_on:
      - api
volumes:
  ielts_pgdata:
```

- [ ] **Step 6: Write `README.md`** — quickstart: `cp .env.example .env && docker compose up --build`, open `http://localhost:5173`, note bands are estimates, `LLM_MODE=stub` is offline.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold v3 repo, compose, remove v1"
```

---

## Task 2: API app factory, config, error envelope, health

**Files:**
- Create: `api/requirements.txt`, `api/Dockerfile`, `api/wsgi.py`, `api/app/__init__.py`, `api/app/config.py`, `api/app/errors.py`, `api/app/routes/health.py`
- Test: `api/tests/test_health.py`

**Interfaces:**
- Produces: `create_app() -> Flask`; `ApiError(code, message, status, details=[])` exception; `error_response(err)` → `(json, status)`. Health at `GET /api/health` → `{ok, llmMode, providerConfigured, asrReady}`.

- [ ] **Step 1: Write `api/requirements.txt`**

```
flask==3.1.1
gunicorn==23.0.0
pydantic==2.9.2
sqlalchemy==2.0.36
alembic==1.14.0
psycopg[binary]==3.2.3
flask-cors==5.0.0
pytest==8.3.3
```

- [ ] **Step 2: Write the failing test `api/tests/test_health.py`**

```python
from app import create_app

def test_health_ok():
    app = create_app({"TESTING": True})
    client = app.test_client()
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["ok"] is True
    assert body["llmMode"] == "stub"
    assert body["providerConfigured"] is False
    assert body["asrReady"] is False
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd api && python -m pytest tests/test_health.py -v`
Expected: FAIL (ImportError: cannot import name create_app)

- [ ] **Step 4: Write `api/app/config.py`**

```python
import os

class Config:
    def __init__(self, overrides=None):
        o = overrides or {}
        self.LLM_MODE = o.get("LLM_MODE", os.getenv("LLM_MODE", "stub"))
        self.LLM_PROVIDER = o.get("LLM_PROVIDER", os.getenv("LLM_PROVIDER", "openrouter"))
        self.OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
        self.ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
        self.DATABASE_URL = o.get("DATABASE_URL", os.getenv("DATABASE_URL", ""))
        self.CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
        self.TESTING = o.get("TESTING", False)

    @property
    def provider_configured(self):
        if self.LLM_MODE == "stub":
            return False
        key = self.OPENROUTER_API_KEY if self.LLM_PROVIDER == "openrouter" else self.ANTHROPIC_API_KEY
        return bool(key)
```

- [ ] **Step 5: Write `api/app/errors.py`**

```python
from flask import jsonify

class ApiError(Exception):
    def __init__(self, code, message, status=400, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.details = details or []

def error_response(err: ApiError):
    return jsonify({"error": {"code": err.code, "message": err.message, "details": err.details}}), err.status

def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def _handle(err):
        return error_response(err)

    @app.errorhandler(404)
    def _nf(_e):
        return error_response(ApiError("NOT_FOUND", "Resource not found", 404))

    @app.errorhandler(500)
    def _ise(_e):
        return error_response(ApiError("INTERNAL", "Internal error", 500))
```

- [ ] **Step 6: Write `api/app/routes/health.py`**

```python
from flask import Blueprint, jsonify, current_app

bp = Blueprint("health", __name__)

@bp.get("/api/health")
def health():
    cfg = current_app.config["APP_CONFIG"]
    return jsonify({
        "ok": True,
        "llmMode": cfg.LLM_MODE,
        "providerConfigured": cfg.provider_configured,
        "asrReady": False,
    })
```

- [ ] **Step 7: Write `api/app/__init__.py`**

```python
from flask import Flask
from flask_cors import CORS
from .config import Config
from .errors import register_error_handlers

def create_app(overrides=None):
    app = Flask(__name__)
    cfg = Config(overrides)
    app.config["APP_CONFIG"] = cfg
    CORS(app, origins=[cfg.CORS_ORIGIN])
    register_error_handlers(app)
    from .routes.health import bp as health_bp
    app.register_blueprint(health_bp)
    return app
```

- [ ] **Step 8: Write `api/wsgi.py`**

```python
from app import create_app
app = create_app()
```

- [ ] **Step 9: Write `api/Dockerfile`**

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5050
CMD ["sh", "-c", "alembic upgrade head && gunicorn -b 0.0.0.0:5050 wsgi:app"]
```

- [ ] **Step 10: Run test, verify it passes**

Run: `cd api && python -m pytest tests/test_health.py -v`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add api && git commit -m "feat(api): app factory, config, error envelope, health"
```

---

## Task 3: SQLAlchemy models + DB session + Alembic migration

**Files:**
- Create: `api/app/data/db.py`, `api/app/data/models.py`, `api/alembic.ini`, `api/migrations/env.py`, `api/migrations/script.py.mako`, `api/migrations/versions/0001_initial.py`
- Test: `api/tests/test_models.py`

**Interfaces:**
- Produces: `Base` (DeclarativeBase); ORM classes `UserProfile, SkillLevel, PlacementCombo, PlacementItem, PlacementAttempt, GeneratedSet, Program, Milestone, Attempt, Mock, Lesson, Card`; `get_session()` context manager; `engine` factory `make_engine(url)`.
- Consumes: `DATABASE_URL` from config.

- [ ] **Step 1: Write the failing test `api/tests/test_models.py`** (uses SQLite in-memory to verify schema/metadata without Postgres)

```python
from sqlalchemy import create_engine
from app.data.models import Base, UserProfile, SkillLevel

def test_create_all_and_insert():
    eng = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(eng)
    from sqlalchemy.orm import Session
    with Session(eng) as s:
        u = UserProfile(name="Arjuna", goal="work", target_band=6.5, skill_targets={})
        s.add(u); s.commit()
        s.add(SkillLevel(user_id=u.id, skill="reading", band="C1"))
        s.commit()
        assert s.query(SkillLevel).count() == 1
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd api && python -m pytest tests/test_models.py -v`
Expected: FAIL (ModuleNotFoundError app.data.models)

- [ ] **Step 3: Write `api/app/data/models.py`**

```python
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

def now():
    return datetime.now(timezone.utc)

class Base(DeclarativeBase):
    pass

class UserProfile(Base):
    __tablename__ = "user_profile"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    goal: Mapped[str] = mapped_column(String(20))
    target_band: Mapped[float] = mapped_column(Float)
    skill_targets: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class SkillLevel(Base):
    __tablename__ = "skill_levels"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_profile.id"))
    skill: Mapped[str] = mapped_column(String(20))
    band: Mapped[str] = mapped_column(String(6))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

class PlacementCombo(Base):
    __tablename__ = "placement_combos"
    combo_id: Mapped[int] = mapped_column(primary_key=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    target_minutes: Mapped[int] = mapped_column(Integer, default=50)
    sections: Mapped[dict] = mapped_column(JSON)

class PlacementItem(Base):
    __tablename__ = "placement_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    combo_id: Mapped[int] = mapped_column(ForeignKey("placement_combos.combo_id"))
    skill: Mapped[str] = mapped_column(String(20))
    band_tag: Mapped[str] = mapped_column(String(6))
    type: Mapped[str] = mapped_column(String(40))
    payload: Mapped[dict] = mapped_column(JSON)
    section_seconds: Mapped[int] = mapped_column(Integer, default=0)

class PlacementAttempt(Base):
    __tablename__ = "placement_attempts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_profile.id"))
    combo_id: Mapped[int] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    per_skill: Mapped[dict] = mapped_column(JSON)
    overall_band: Mapped[float] = mapped_column(Float)
    cefr: Mapped[str] = mapped_column(String(6))
    gap_to_target: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class GeneratedSet(Base):
    __tablename__ = "generated_sets"
    id: Mapped[int] = mapped_column(primary_key=True)
    skill: Mapped[str] = mapped_column(String(20))
    band: Mapped[str] = mapped_column(String(6))
    set_index: Mapped[int] = mapped_column(Integer)
    payload: Mapped[dict] = mapped_column(JSON)
    source: Mapped[str] = mapped_column(String(12), default="seed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Program(Base):
    __tablename__ = "programs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_profile.id"))
    length_days: Mapped[int] = mapped_column(Integer)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    status: Mapped[str] = mapped_column(String(12), default="active")

class Milestone(Base):
    __tablename__ = "milestones"
    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    idx: Mapped[int] = mapped_column(Integer)
    day_target: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(160))
    targets: Mapped[dict] = mapped_column(JSON)
    achieved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

# Defined now for stable schema; exercised in later phases.
class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(20))
    task: Mapped[str] = mapped_column(String(40), default="")
    prompt: Mapped[str] = mapped_column(String, default="")
    body: Mapped[str] = mapped_column(String, default="")
    bands: Mapped[dict] = mapped_column(JSON, default=dict)
    criteria: Mapped[dict] = mapped_column(JSON, default=dict)
    cefr: Mapped[str] = mapped_column(String(6), default="")
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Mock(Base):
    __tablename__ = "mocks"
    id: Mapped[int] = mapped_column(primary_key=True)
    listening: Mapped[float] = mapped_column(Float, default=0.0)
    reading: Mapped[float] = mapped_column(Float, default=0.0)
    overall: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Lesson(Base):
    __tablename__ = "lessons"
    day: Mapped[int] = mapped_column(primary_key=True)
    lesson: Mapped[dict] = mapped_column(JSON)
    focus: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Card(Base):
    __tablename__ = "cards"
    id: Mapped[int] = mapped_column(primary_key=True)
    front: Mapped[str] = mapped_column(String)
    back: Mapped[str] = mapped_column(String)
    ease: Mapped[float] = mapped_column(Float, default=2.5)
    interval: Mapped[int] = mapped_column(Integer, default=0)
    reps: Mapped[int] = mapped_column(Integer, default=0)
    lapses: Mapped[int] = mapped_column(Integer, default=0)
    due: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
```

- [ ] **Step 4: Write `api/app/data/db.py`**

```python
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_engine = None
_Session = None

def make_engine(url):
    return create_engine(url, pool_pre_ping=True)

def init_engine(url):
    global _engine, _Session
    _engine = make_engine(url)
    _Session = sessionmaker(bind=_engine)
    return _engine

@contextmanager
def get_session():
    s = _Session()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()
```

- [ ] **Step 5: Write Alembic config** — `api/alembic.ini` (standard, `script_location = migrations`, `sqlalchemy.url` read from env in `env.py`), `api/migrations/env.py` importing `Base.metadata` as target_metadata and reading `DATABASE_URL`, `api/migrations/script.py.mako` (default template).

`api/migrations/env.py` core:

```python
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.data.models import Base

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", ""))
target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine_from_config(config.get_section(config.config_ini_section),
                                     prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
```

- [ ] **Step 6: Generate initial migration**

Run: `cd api && DATABASE_URL=postgresql+psycopg://ielts:ielts@localhost:5432/ielts alembic revision --autogenerate -m initial`
(Or hand-write `0001_initial.py` calling `Base.metadata.create_all`-equivalent op.create_table for every model.) Save as `migrations/versions/0001_initial.py`.

- [ ] **Step 7: Run test, verify it passes**

Run: `cd api && python -m pytest tests/test_models.py -v`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add api && git commit -m "feat(api): SQLAlchemy models, db session, alembic initial migration"
```

---

## Task 4: Repositories

**Files:**
- Create: `api/app/data/repositories.py`
- Test: `api/tests/test_repositories.py`

**Interfaces:**
- Produces a `Repository` facade with: `create_user(name,goal,target_band,skill_targets)->UserProfile`; `get_user()->UserProfile|None`; `set_skill_level(user_id,skill,band)`; `get_skill_levels(user_id)->list[(skill,band)]`; `get_combo(combo_id)->dict`; `list_combo_ids()->list[int]`; `save_placement_attempt(...)->int`; `serve_set(skill,band)->dict|None`; `mark_sets_ready()`; `create_program(user_id,length_days)->Program`; `add_milestones(program_id, items)`; `get_milestones(program_id)->list`.
- Consumes: `get_session` from db.py, models from Task 3.

- [ ] **Step 1: Write failing test `api/tests/test_repositories.py`** (SQLite in-memory, inject session factory)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.data.models import Base, PlacementCombo
from app.data.repositories import Repository

def make_repo():
    eng = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(eng)
    return Repository(sessionmaker(bind=eng))

def test_user_and_skill_levels():
    repo = make_repo()
    u = repo.create_user("Arjuna", "work", 6.5, {})
    repo.set_skill_level(u.id, "reading", "C1")
    repo.set_skill_level(u.id, "reading", "C2")  # upsert
    levels = dict(repo.get_skill_levels(u.id))
    assert levels["reading"] == "C2"
```

- [ ] **Step 2: Run test, verify it fails** — `pytest tests/test_repositories.py -v` → FAIL (no repositories module)

- [ ] **Step 3: Write `api/app/data/repositories.py`** — implement the facade; `Repository(session_factory)` stores the factory and opens a short-lived session per method. `set_skill_level` does select-then-update-or-insert. `serve_set` selects all rows for `(skill,band)` and returns a random one's payload (use `random.choice`). Provide the full methods listed in Interfaces.

- [ ] **Step 4: Run test, verify it passes** — `pytest tests/test_repositories.py -v` → PASS

- [ ] **Step 5: Commit** — `git add api && git commit -m "feat(api): repositories facade"`

---

## Task 5: Pydantic schemas

**Files:**
- Create: `api/app/schemas/__init__.py`
- Test: `api/tests/test_schemas.py`

**Interfaces:**
- Produces request/response models: `OnboardingIn(name,goal,targetBand,skillTargets?)`, `PlacementStartOut(comboId,sections,targetMinutes)`, `PlacementSubmitIn(comboId,answers,writingSamples,speakingText?)`, `PerSkill`, `PlacementResultOut(perSkill,overallBand,cefr,gapToTarget)`, `ProgramIn(lengthDays)`, `MilestoneOut`, `ProgramOut(program,milestones)`, `SkillLevelOut(skill,band)`, `GenerateJobOut(jobId)`, `JobStatusOut(done,progress)`. Use `model_config = ConfigDict(populate_by_name=True)` with camelCase aliases. Enums: `Goal`, `Cefr`, `Skill`, `ProgramLength`.

- [ ] **Step 1: Write failing test `api/tests/test_schemas.py`**

```python
import pytest
from pydantic import ValidationError
from app.schemas import OnboardingIn, ProgramIn

def test_onboarding_valid():
    m = OnboardingIn(name="A", goal="work", targetBand=6.5)
    assert m.target_band == 6.5

def test_onboarding_rejects_bad_goal():
    with pytest.raises(ValidationError):
        OnboardingIn(name="A", goal="vacation", targetBand=6.5)

def test_program_rejects_bad_length():
    with pytest.raises(ValidationError):
        ProgramIn(lengthDays=45)
```

- [ ] **Step 2: Run test, verify it fails** — FAIL (no schemas module)

- [ ] **Step 3: Write `api/app/schemas/__init__.py`** — define the enums and models above with camelCase aliases (`Field(alias="targetBand")`), `targetBand` constrained to 4.0–9.0, `lengthDays` Literal[30,90,180], `goal` the Goal enum. Include the response models with `from_attributes=True` where built from domain dataclasses.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(api): pydantic contracts"`

---

## Task 6: Fixtures + seed loader

**Files:**
- Create: `fixtures/placement_combos.json`, `fixtures/seed_sets.json`, `fixtures/stub_responses.json`, `fixtures/tips.json`
- Create: `api/app/data/seed.py`
- Test: `api/tests/test_seed.py`

**Interfaces:**
- Produces: `load_fixture(name)->dict`; `seed_all(repo_or_session)` inserting 2 combos (with items) + 5 sets/skill into the DB if empty. Fixture shapes below.
- Consumes: repositories/models.

**Fixture shapes (author concrete content per blueprint difficulty spreads):**
- `placement_combos.json`: `[{ "comboId":1, "targetMinutes":50, "sections":{...}, "items":[ {"skill":"reading","bandTag":"B1","type":"tfng","payload":{"stem":"...","options":["True","False","Not Given"],"answer":"True"},"sectionSeconds":840}, ... ] }, {comboId:2,...}]`. Reading spread A1A2×2·B1×4·B2×4·C1×2·C2×1 (13 items); Listening A1A2×2·B1×3·B2×3·C1×1·C2×1 (10); Writing 1 Task-2 prompt; Speaking P1×3+P2 cue+P3×1.
- `seed_sets.json`: `{ "reading":[{setIndex:1,band:"B2",payload:{title,passage,questions:[...]}}, ...5], "listening":[...5], "writing":[...5 prompts], "speaking":[...5 question sets] }`.
- `stub_responses.json`: `{ "generate:reading:B2": {title,passage,questions:[...]}, "score:writing": {bands:{...},cefr:"B1",corrections:[...],rewrite:"..."}, "score:speaking": {...} }`.
- `tips.json`: `{ "reading":{title,bullets:[...]}, "listening":{...}, "writing":{...}, "speaking":{...} }` from PRD §7.

- [ ] **Step 1: Author the four fixture files** with concrete, human-readable content (real passages/questions/keys, band-tagged). Keep Reading passages in plain text; include answer keys for every L/R item.

- [ ] **Step 2: Write failing test `api/tests/test_seed.py`**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.data.models import Base, PlacementCombo, GeneratedSet
from app.data.seed import seed_all

def test_seed_counts():
    eng = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(eng)
    Session = sessionmaker(bind=eng)
    seed_all(Session)
    with Session() as s:
        assert s.query(PlacementCombo).count() == 2
        # 4 skills x 5 sets
        assert s.query(GeneratedSet).count() == 20
```

- [ ] **Step 3: Run test, verify it fails** — FAIL (no seed module)

- [ ] **Step 4: Write `api/app/data/seed.py`** — `load_fixture` reads `fixtures/<name>.json` relative to repo root; `seed_all(Session)` checks if combos exist; if empty, inserts combos+items from `placement_combos.json` and 5 sets/skill from `seed_sets.json` with `source="seed"`.

- [ ] **Step 5: Wire seed into migration/startup** — call `seed_all` at the end of `0001_initial` migration (data migration step) OR in `create_app` after `init_engine`. Choose migration-time seeding so `alembic upgrade head` seeds.

- [ ] **Step 6: Run test, verify it passes** — PASS

- [ ] **Step 7: Commit** — `git commit -m "feat(api): fixtures + seed loader (2 combos, 5 sets/skill)"`

---

## Task 7: domain/leveling.py (CEFR 5-band params + labeling)

**Files:**
- Create: `api/app/domain/leveling.py`
- Test: `api/tests/test_leveling.py`

**Interfaces:**
- Produces: `BANDS = ["A1A2","B1","B2","C1","C2"]`; `next_band(band)->band` (caps at C2); `band_params(skill, band)->dict` (lexical_freq, sentence_complexity, length, question_types, target_raw_band) per PRD §5.2; `cefr_to_ielts(band)->(low,high)`; `ielts_to_cefr(score)->band` per PRD §5.1 table.

- [ ] **Step 1: Write failing test `api/tests/test_leveling.py`**

```python
from app.domain.leveling import next_band, ielts_to_cefr, band_params, BANDS

def test_next_band_caps():
    assert next_band("B1") == "B2"
    assert next_band("C2") == "C2"

def test_ielts_to_cefr():
    assert ielts_to_cefr(3.5) == "A1A2"
    assert ielts_to_cefr(4.5) == "B1"
    assert ielts_to_cefr(6.0) == "B2"
    assert ielts_to_cefr(7.5) == "C1"
    assert ielts_to_cefr(9.0) == "C2"

def test_band_params_reading_grows_with_band():
    assert band_params("reading","B1")["length"] < band_params("reading","C1")["length"]
```

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Write `api/app/domain/leveling.py`** — implement the mapping table (A1A2 <4.0, B1 4.0–5.0, B2 5.5–6.5, C1 7.0–8.0, C2 8.5–9.0) and per-band generation params (reading length B1≈575, B2≈700, C1≈850, etc.).

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(domain): CEFR leveling + band params"`

---

## Task 8: domain/scoring.py + domain/placement.py (locator scoring)

**Files:**
- Create: `api/app/domain/scoring.py`, `api/app/domain/placement.py`
- Test: `api/tests/test_placement_scoring.py`

**Interfaces:**
- Produces (`scoring.py`): `locator_band(tier_results: dict[band,(correct,total)], pass_threshold=0.667)->band` — highest tier passed monotonically; `overall_band(skill_bands: dict[skill,float])->float` rounded to nearest 0.5.
- Produces (`placement.py`): `grade_placement(combo, answers, writing_band, speaking_band)->dict` returning `{perSkill, overallBand, cefr, gapToTarget}` given a target; `serve_combo(repo)->dict` (picks a combo id, returns sections/items without answer keys).
- Consumes: leveling (`ielts_to_cefr`), repositories.

- [ ] **Step 1: Write failing test `api/tests/test_placement_scoring.py`** (the blueprint §7.1 worked example)

```python
from app.domain.scoring import locator_band, overall_band

def test_locator_blueprint_example():
    # Reading: A2 2/2, B1 4/4, B2 3/4, C1 0/2, C2 0/1 -> passes through B1, borderline B2 -> B2
    tiers = {"A1A2":(2,2),"B1":(4,4),"B2":(3,4),"C1":(0,2),"C2":(0,1)}
    assert locator_band(tiers) == "B2"

def test_locator_weak_user():
    tiers = {"A1A2":(2,2),"B1":(1,4),"B2":(0,4),"C1":(0,2),"C2":(0,1)}
    assert locator_band(tiers) == "A1A2"

def test_overall_band_rounds_half():
    assert overall_band({"l":6.0,"r":7.0,"w":5.0,"s":5.0}) == 5.75 or overall_band({"l":6.0,"r":7.0,"w":5.0,"s":5.0}) == 6.0
```

(Note: fix the rounding expectation when implementing — IELTS rounds mean to nearest 0.5; 5.75 → 6.0. Assert exactly `6.0`.)

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Write `api/app/domain/scoring.py`** — `locator_band`: iterate tiers low→high; a tier "passes" if `correct/total >= threshold` (total 0 → treated as pass/skip); place at the highest tier where it and all lower tiers pass; `overall_band`: mean → round to nearest 0.5 (`round(x*2)/2`).

- [ ] **Step 4: Write `api/app/domain/placement.py`** — `grade_placement` groups L/R answers by band_tag vs the combo key, calls `locator_band` per skill, maps W/S examiner bands via `ielts_to_cefr`, computes overall + gap.

- [ ] **Step 5: Run test, verify it passes** — fix the rounding assertion to `== 6.0`. PASS

- [ ] **Step 6: Commit** — `git commit -m "feat(domain): locator placement scoring"`

---

## Task 9: domain/program.py (programs + milestones)

**Files:**
- Create: `api/app/domain/program.py`
- Test: `api/tests/test_program.py`

**Interfaces:**
- Produces: `build_milestones(length_days, start_levels: dict[skill,band], target_band)->list[dict]` — for 30 → 2 milestones, 90 → 4, 180 → 6; each `{idx, dayTarget, title, targets:{skill:band}}` ramping each skill one band toward the CEFR of target_band, capped.
- Consumes: leveling (`next_band`, `ielts_to_cefr`).

- [ ] **Step 1: Write failing test `api/tests/test_program.py`**

```python
from app.domain.program import build_milestones

def test_milestone_counts():
    ms = build_milestones(90, {"reading":"C1","writing":"B1","listening":"B1","speaking":"B1"}, 6.5)
    assert len(ms) == 4
    assert ms[0]["dayTarget"] < ms[-1]["dayTarget"] == 90
    # writing ramps up over time, never exceeds target cefr (B2 for 6.5)
    assert ms[-1]["targets"]["writing"] in ("B2","C1")
```

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Write `api/app/domain/program.py`** — distribute milestones evenly across `length_days`; each milestone bumps a skill toward `ielts_to_cefr(target_band)` using `next_band`, not overshooting the target CEFR.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(domain): programs + milestones"`

---

## Task 10: services/llm.py stub gateway + prompts.py

**Files:**
- Create: `api/app/services/llm.py`, `api/app/services/prompts.py`
- Test: `api/tests/test_llm_stub.py`

**Interfaces:**
- Produces: `LlmGateway(config)` with `generate(task, skill=None, band=None, **kw)->dict` and `score(task, **kw)->dict`. In `LLM_MODE=stub`, both read `fixtures/stub_responses.json` by key `f"{task}:{skill}:{band}"` (generate) / `f"score:{task}"` (score), returning `{**payload, "stub": True}`. Live branch raises `ApiError("LLM_UNAVAILABLE", ...)` for now (wired Phase 2). Keys never returned.
- Produces (`prompts.py`): `GENERATE_PROMPTS`, `SCORE_PROMPTS` dicts (authored now, used in Phase 2).

- [ ] **Step 1: Write failing test `api/tests/test_llm_stub.py`**

```python
from app.config import Config
from app.services.llm import LlmGateway

def test_stub_generate_returns_fixture():
    gw = LlmGateway(Config({"LLM_MODE":"stub"}))
    out = gw.generate("generate", skill="reading", band="B2")
    assert out["stub"] is True
    assert "passage" in out

def test_stub_never_leaks_key():
    gw = LlmGateway(Config({"LLM_MODE":"stub"}))
    out = gw.score("writing", essay="hello")
    assert "api_key" not in out and "OPENROUTER_API_KEY" not in out
```

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Write `api/app/services/prompts.py`** — author the generation + scoring prompts (reuse v1 examiner rubric wording as reference; full IELTS 4-criteria rubric for writing/speaking).

- [ ] **Step 4: Write `api/app/services/llm.py`** — implement gateway as specified; load fixture once.

- [ ] **Step 5: Run test, verify it passes** — PASS

- [ ] **Step 6: Commit** — `git commit -m "feat(services): stub LLM gateway + prompts"`

---

## Task 11: Routes — onboarding, placement, skill-levels

**Files:**
- Create: `api/app/routes/onboarding.py`, `api/app/routes/placement.py`, `api/app/routes/skills.py`
- Modify: `api/app/__init__.py` (register blueprints, init engine + repo)
- Test: `api/tests/test_routes_journey.py`

**Interfaces:**
- Consumes: schemas, repositories, domain placement, Repository injected via `current_app.config["REPO"]`.
- Produces: `POST /api/onboarding`, `POST /api/placement/start`, `POST /api/placement/submit`, `GET /api/skill-levels`.

- [ ] **Step 1: Modify `__init__.py`** to `init_engine(cfg.DATABASE_URL)` (skip if TESTING with injected repo), build `Repository`, store in `app.config["REPO"]`, register all blueprints. Allow `overrides={"REPO":...}` for tests.

- [ ] **Step 2: Write failing test `api/tests/test_routes_journey.py`** — use an in-memory SQLite Repository injected via overrides; seed it; POST onboarding → 200; placement/start → comboId in {1,2}; placement/submit with all-correct answers → perSkill present + skill-levels reflects it.

```python
def test_journey_onboarding_to_levels(client_with_seed):
    r = client_with_seed.post("/api/onboarding", json={"name":"A","goal":"work","targetBand":6.5})
    assert r.status_code == 200
    s = client_with_seed.post("/api/placement/start", json={})
    assert s.get_json()["comboId"] in (1,2)
```

- [ ] **Step 3: Implement the three route modules** — validate input with Pydantic (catch `ValidationError` → `ApiError("VALIDATION",...,422)`), call domain, persist, return Pydantic-dumped JSON. `placement/submit` computes writing/speaking bands from the stub gateway `score` results when samples present (else conservative default), grades L/R via `grade_placement`, seeds `skill_levels`.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(api): onboarding, placement, skill-levels routes"`

---

## Task 12: Routes — practice, program, tips

**Files:**
- Create: `api/app/routes/practice.py`, `api/app/routes/program.py`, `api/app/routes/tips.py`
- Modify: `api/app/__init__.py` (register)
- Test: `api/tests/test_routes_practice.py`

**Interfaces:**
- Produces: `POST /api/practice/generate`→`{jobId}` (stub marks seed sets ready synchronously, returns a jobId), `GET /api/practice/status`→`{done:true,progress:100}`, `GET /api/practice/set?skill=&band=`→randomized set, `POST /api/program`→`{program,milestones}`, `GET /api/program/milestones`, `GET /api/tips/<skill>`.

- [ ] **Step 1: Write failing test `api/tests/test_routes_practice.py`** — generate → jobId; status → done; set?skill=reading&band=B2 → payload with questions; program lengthDays=90 → 4 milestones; tips/reading → bullets.

- [ ] **Step 2: Implement the three modules** — practice generate is synchronous in stub (sets already seeded), returns `{"jobId":"stub-1"}`; `/set` calls `repo.serve_set`; program calls `build_milestones`, persists; tips reads `fixtures/tips.json`.

- [ ] **Step 3: Run test, verify it passes** — PASS

- [ ] **Step 4: Commit** — `git commit -m "feat(api): practice, program, tips routes"`

---

## Task 13: Routes — skill stubs (reading/listening/writing/speaking)

**Files:**
- Create: `api/app/routes/reading.py`, `listening.py`, `writing.py`, `speaking.py`
- Modify: `api/app/__init__.py`
- Test: `api/tests/test_routes_skills.py`

**Interfaces:**
- Produces: `POST /api/reading/generate {band}`→banded fixture set (via gateway.generate), `POST /api/listening/generate {band}`, `POST /api/writing/evaluate {taskType,prompt,essay}`→stub bands+corrections+cefr, `POST /api/speaking/evaluate {part,question,transcript}`→stub bands+feedback+cefr.

- [ ] **Step 1: Write failing test `api/tests/test_routes_skills.py`** — writing/evaluate returns `bands` + `cefr` + `stub:true`; reading/generate returns a set; no key in response.

- [ ] **Step 2: Implement** — thin handlers delegating to `gateway.generate/score`; writing/speaking persist to `attempts` (optional in Phase 1) and return the stub payload.

- [ ] **Step 3: Run test, verify it passes** — PASS

- [ ] **Step 4: Commit** — `git commit -m "feat(api): reading/listening/writing/speaking stub routes"`

---

## Task 14: Web scaffold — Vite, Tailwind v4 tokens, fonts, API client, types

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`, `web/index.html`, `web/Dockerfile`, `web/src/main.tsx`, `web/src/App.tsx`, `web/src/app.css`, `web/src/lib/api/client.ts`, `web/src/lib/types.ts`
- Create: `web/src/assets/fonts/` (Inter, Lexend, Atkinson Hyperlegible, OpenDyslexic woff2)
- Test: `web/src/lib/api/client.test.ts` (Vitest)

**Interfaces:**
- Produces: `api` client object with typed methods (`health()`, `onboarding(body)`, `placementStart()`, `placementSubmit(body)`, `practiceGenerate()`, `practiceStatus(jobId)`, `practiceSet(skill,band)`, `program(lengthDays)`, `milestones()`, `skillLevels()`, `tips(skill)`, `writingEvaluate(body)`, `speakingEvaluate(body)`, `readingGenerate(band)`, `listeningGenerate(band)`); reads base from `import.meta.env.VITE_API_BASE`. Types in `types.ts` mirror Pydantic camelCase.

- [ ] **Step 1: Write `web/package.json`** — deps react@19.2, react-dom@19.2, lucide-react, recharts; devDeps vite@8.1, @vitejs/plugin-react, typescript@5, tailwindcss@4.3, @tailwindcss/vite, vitest, @testing-library/react, jsdom. Scripts: `dev` (`vite --host --port 5173`), `build`, `test` (`vitest run`).

- [ ] **Step 2: Write `web/vite.config.ts`** — react plugin + `@tailwindcss/vite`; server host true, port 5173.

- [ ] **Step 3: Write `web/src/app.css`** — `@import "tailwindcss";` + the `@theme` token block from UI-UX-SPEC §6 (all `--color-*`, fonts, radii); `@font-face` for the 4 self-hosted fonts; `.dark` overrides for neutral/brand vars.

- [ ] **Step 4: Write `web/src/lib/types.ts`** — TS interfaces mirroring the Pydantic responses (UserProfile, PlacementStart, PerSkill, PlacementResult, Milestone, Program, SkillLevel, etc.).

- [ ] **Step 5: Write failing test `web/src/lib/api/client.test.ts`** — mock `fetch`, assert `api.health()` calls `${base}/api/health` and returns parsed JSON; assert a non-2xx throws an error carrying `error.code`.

- [ ] **Step 6: Write `web/src/lib/api/client.ts`** — a `request()` helper that prefixes base, sets JSON headers, throws on `!res.ok` reading the error envelope; typed methods.

- [ ] **Step 7: Write `web/index.html`, `main.tsx`, `App.tsx`** (App renders a placeholder "loading" until journey wired), `web/Dockerfile` (`node:22`, `npm ci`, `npm run dev` for Phase 1 dev image), `tsconfig.json`.

- [ ] **Step 8: Run test, verify it passes** — `cd web && npm test` → PASS

- [ ] **Step 9: Commit** — `git commit -m "feat(web): scaffold vite+tailwind v4, tokens, fonts, typed api client"`

---

## Task 15: In-house UI primitives

**Files:**
- Create: `web/src/components/ui/{Button,Field,Textarea,Card,Badge,LevelChip,Timer,ProgressBar,StepIndicator,QuizNavigator,Dialog,Toast,RadioCard,Slider}.tsx`, `web/src/components/ui/index.ts`
- Test: `web/src/components/ui/ui.test.tsx`

**Interfaces:**
- Produces themed, a11y-first primitives. `LevelChip({band})` colors per UI-UX-SPEC §3.4 + always renders the band label. `Timer({seconds,onExpire})` renders `mm:ss`, turns amber <120s, announces via `aria-live="polite"`, calls `onExpire` at 0. `QuizNavigator({items,current,onJump})` chips with status (answered/correct/wrong/current). `Button` variants primary/secondary/ghost/destructive + focus ring + loading.

- [ ] **Step 1: Write failing test `ui.test.tsx`** — render `<LevelChip band="C1"/>` shows "C1"; `<Timer seconds={1}/>` calls `onExpire` after tick (fake timers); `<Button loading>` is disabled.

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Implement primitives** — token-driven Tailwind classes; ≥44px targets; visible focus ring; reduced-motion respected. Keep each file small and single-purpose.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(web): in-house themed UI primitives"`

---

## Task 16: Journey state machine + Welcome + Onboarding

**Files:**
- Create: `web/src/lib/journey.ts`, `web/src/components/welcome/Welcome.tsx`, `web/src/components/onboarding/Onboarding.tsx`
- Modify: `web/src/App.tsx` (render current journey screen)
- Test: `web/src/components/onboarding/onboarding.test.tsx`

**Interfaces:**
- Produces: `JourneyProvider` + `useJourney()` exposing `step` and `go(step)`; steps enum `welcome|onboarding|placement|generating|results|program|milestones|app`. Onboarding 3-step stepper posting to `api.onboarding`, then `go("placement")`. On mount, `App` calls `api.skillLevels()`; if a profile exists, jump to `app`.

- [ ] **Step 1: Write failing test `onboarding.test.tsx`** — fill name, pick goal, set target, submit → `api.onboarding` called with `{name,goal,targetBand}`; Next disabled until each step valid.

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Implement `journey.ts`, `Welcome.tsx`, `Onboarding.tsx`** — stepper with StepIndicator, RadioCard goals, Slider target band; validation gates Next.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(web): journey machine, welcome, onboarding"`

---

## Task 17: Placement runner (TestFrame + L/R/W/S sections + timer)

**Files:**
- Create: `web/src/components/placement/{PlacementIntro,TestFrame,ListeningSection,ReadingSection,WritingSection,SpeakingSection,PlacementRunner}.tsx`
- Test: `web/src/components/placement/placement.test.tsx`

**Interfaces:**
- Consumes: `api.placementStart`, `api.placementSubmit`, ui primitives (Timer, QuizNavigator, Editor via Textarea, recorder placeholder).
- Produces: `PlacementRunner` that fetches a combo, walks sections L→R→W→S each with its own countdown, captures answers, auto-advances on timeout, submits all → `go("generating")` storing the result in journey context. Speaking in Phase 1 captures a **typed** transcript fallback (recorder UI present but ASR deferred) per blueprint §10.

- [ ] **Step 1: Write failing test `placement.test.tsx`** — mock `placementStart` returns combo with 1 reading item; answering then advancing through sections calls `placementSubmit` with collected answers; timer expiry auto-advances.

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Implement** — TestFrame sticky header (section name + "n of 4" + Timer) + sticky footer (Next/Submit); Reading two-pane (Lexend ≥18px) / stacked mobile; Listening uses Web Speech `speechSynthesis` to read the transcript (offline, browser capability) + play-once gate; Writing editor with live word count; Speaking recorder UI with typed fallback textarea.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(web): placement runner with timed sections"`

---

## Task 18: Generating loading + Results (radar)

**Files:**
- Create: `web/src/components/placement/Generating.tsx`, `web/src/components/results/Results.tsx`
- Test: `web/src/components/results/results.test.tsx`

**Interfaces:**
- Consumes: `api.practiceGenerate`, `api.practiceStatus`, the placement result from journey context; Recharts radar.
- Produces: `Generating` polls status until done → `go("results")`; `Results` renders radar + 4 skill cards (LevelChip, approx IELTS, gap bar) + overall headline + CTA `go("program")`. Radar has a data-table equivalent for a11y.

- [ ] **Step 1: Write failing test `results.test.tsx`** — given a result `{perSkill:{reading:{cefr:"C1"}...}}`, Results shows "C1" for reading and a "Choose your program" button that calls `go("program")`.

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Implement** — skeleton loader + stepped checklist; Results radar + cards + accessible table.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(web): generating loader + results radar"`

---

## Task 19: Program selection + Milestones brief

**Files:**
- Create: `web/src/components/program/Program.tsx`, `web/src/components/milestones/Milestones.tsx`
- Test: `web/src/components/program/program.test.tsx`

**Interfaces:**
- Consumes: `api.program(lengthDays)`, `api.milestones()`.
- Produces: three RadioCard plan options (30/90/180) with a recommended tag based on gap; selecting + confirm calls `api.program`, stores milestones, `go("milestones")`; Milestones renders a vertical stepper of per-skill targets (LevelChips) + CTA `go("app")`.

- [ ] **Step 1: Write failing test `program.test.tsx`** — picking 90-day plan and confirming calls `api.program` with `{lengthDays:90}` then `go("milestones")`.

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Implement** — radio-group semantics; recommendation in text; milestone ordered list.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(web): program selection + milestones"`

---

## Task 20: App shell (sidebar / bottom tabs / menu + level chips)

**Files:**
- Create: `web/src/components/menu/{AppShell,Sidebar,BottomTabs,Home}.tsx`
- Test: `web/src/components/menu/shell.test.tsx`

**Interfaces:**
- Consumes: `api.skillLevels()`.
- Produces: `AppShell` with responsive Sidebar (desktop) / BottomTabs (mobile); nav entries Home · Practice(Reading/Listening/Speaking/Writing) · Test · Tips · Progress · Settings; each skill entry shows a LevelChip from skill-levels; `Home` shows Today card + skill map + milestone progress. Internal app routing via simple `view` state (no router lib needed).

- [ ] **Step 1: Write failing test `shell.test.tsx`** — given skill-levels `{reading:"C1"}`, the Reading nav entry shows "C1"; clicking Tips sets view to tips.

- [ ] **Step 2: Run test, verify it fails** — FAIL

- [ ] **Step 3: Implement** — responsive shell, level chips, view switching.

- [ ] **Step 4: Run test, verify it passes** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(web): responsive app shell + menu"`

---

## Task 21: Skill screens — Reading/Listening (local grade), Writing/Speaking (stub), Tips, Progress placeholder

**Files:**
- Create: `web/src/components/reading/Reading.tsx`, `listening/Listening.tsx`, `writing/Writing.tsx`, `speaking/Speaking.tsx`, `tips/Tips.tsx`, `progress/Progress.tsx`, and a shared `web/src/components/practice/QuizRunner.tsx`
- Test: `web/src/components/practice/quiz.test.tsx`, `web/src/components/tips/tips.test.tsx`

**Interfaces:**
- Consumes: `api.practiceSet`, `api.writingEvaluate`, `api.speakingEvaluate`, `api.tips`.
- Produces: `QuizRunner` (shared by Reading/Listening): renders a banded set, navigator, **grades locally** against keys, shows a score card. Writing: editor → `writingEvaluate` → feedback view (bands/criteria/corrections/CEFR badge). Speaking: typed transcript → `speakingEvaluate` → feedback. Tips: accordion strategy cards. Progress: empty-state placeholder.

- [ ] **Step 1: Write failing tests** — `quiz.test.tsx`: answering all items correctly shows full score; `tips.test.tsx`: Tips renders reading bullets and toggles an accordion.

- [ ] **Step 2: Run tests, verify they fail** — FAIL

- [ ] **Step 3: Implement** — QuizRunner local grading + scoreCard; Writing/Speaking feedback views; Tips accordions; header LevelChip + "Level: B2 · targeting C1" line.

- [ ] **Step 4: Run tests, verify they pass** — PASS

- [ ] **Step 5: Commit** — `git commit -m "feat(web): skill screens, tips, progress placeholder"`

---

## Task 22: Compose smoke test, secret scan, README quickstart, DoD verification

**Files:**
- Create: `tests/smoke.sh`, `tests/secret_scan.sh`
- Modify: `README.md`
- Test: manual + scripts

**Interfaces:**
- Produces: `tests/smoke.sh` — `docker compose up -d --build`, wait for `/api/health` ok, `curl` placement/start + program, `docker compose down`. `tests/secret_scan.sh` — grep the web bundle + responses for key patterns, fail if found.

- [ ] **Step 1: Write `tests/smoke.sh`** — poll `http://localhost:5050/api/health` until `ok:true` (timeout 120s), assert `llmMode=stub`, hit `/api/placement/start`, then `docker compose down`.

- [ ] **Step 2: Write `tests/secret_scan.sh`** — `grep -rIE 'OPENROUTER_API_KEY|ANTHROPIC_API_KEY|sk-[a-zA-Z0-9]' web/dist api/app && exit 1 || exit 0` (after a `web` build), plus assert no key in `/api/health` output.

- [ ] **Step 3: Run the full stack** — `cp .env.example .env && docker compose up --build -d`; verify `/api/health`; open `http://localhost:5173` and walk welcome→onboarding→placement→generating→results→program→milestones→menu offline (disconnect network to prove zero outbound).

- [ ] **Step 4: Verify persistence** — `docker compose down && docker compose up -d`; the seeded combos/sets persist (named volume); a completed onboarding/placement persists.

- [ ] **Step 5: Run pytest + vitest** — `docker compose exec api python -m pytest` and `cd web && npm test` all green.

- [ ] **Step 6: Update README** with the verified quickstart + the honesty note (bands are estimates) + "Phase 1 = offline stub journey; live LLM/ASR/metrics in later phases".

- [ ] **Step 7: Commit** — `git commit -m "test: compose smoke + secret scan; docs: README quickstart"`

---

## Self-Review (completed)

**Spec coverage:** Welcome/Onboarding (T16) · Placement 1-of-N + timer + grading (T6 fixtures, T8 scoring, T11 routes, T17 UI) · Generating loader (T18) · Results per-skill+CEFR+radar (T18) · Program 30/90/180 + milestones (T9, T12, T19) · App-shell menu + current-level badges (T20) · Tips (T6 fixtures, T12 route, T21 UI) · Reading/Listening local grade (T21) · Writing/Speaking stub eval (T13, T21) · Stub LLM gateway + routing seam (T10) · CEFR banding (T7) · Pydantic contracts + envelope (T2, T5) · Postgres + migration + seeds (T3, T6) · Docker compose offline (T1, T22) · Verification/DoD (T22). Deferred items (ASR, essay metrics, flashcards, lessons, history charts, v1 import, live LLM) are intentionally out of Phase 1 per design §2.

**Placeholder scan:** Frontend tasks reference UI-UX-SPEC for exact tokens/visuals by design (tokens are authored in T14 §6 and reused); domain/backend tasks contain full TDD code. No TBD/TODO left in the critical path.

**Type consistency:** band enum `A1A2,B1,B2,C1,C2`, skills `listening,reading,writing,speaking`, goals `work,study_abroad,other`, lengths `30,90,180` used consistently across schemas (T5), models (T3), leveling (T7), program (T9), and TS types (T14). Gateway keys `generate:{skill}:{band}` / `score:{task}` consistent between T10 and fixtures (T6).
