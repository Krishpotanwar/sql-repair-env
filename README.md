---
title: SQL Repair Env
emoji: 📊
colorFrom: red
colorTo: purple
sdk: docker
app_port: 8000
pinned: false
license: apache-2.0
short_description: OpenEnv SQL repair tasks with a live frontend
---

# SQL Repair OpenEnv

An OpenEnv environment for the **Meta PyTorch x Scaler hackathon** where
agents repair broken SQL queries against a small SQLite schema.

## Live Links

- GitHub: [Krishpotanwar/sql-repair-env](https://github.com/Krishpotanwar/sql-repair-env)
- Hugging Face Space: [krishpotanwar/sql-repair-env](https://huggingface.co/spaces/krishpotanwar/sql-repair-env)
- Live app: [krishpotanwar-sql-repair-env.hf.space](https://krishpotanwar-sql-repair-env.hf.space/)

## What This Repo Includes

- A FastAPI OpenEnv backend with `/health`, `/tasks`, `/reset`, `/step`, `/grader`, and `/baseline`
- `/api/*` aliases so the frontend can call the same environment through the Hugging Face Space root
- A frontend command center inspired by the `disasterman` UI shell, adapted for SQL query repair workflows
- Three deterministic SQL repair tasks with strict scoring in `(0, 1)`
- A validator-safe inference runner that always emits bounded scores even on missing-key or crash paths

## Tasks

| ID       | Difficulty | What's broken                            |
|----------|------------|------------------------------------------|
| `task_1` | easy       | SELECT list missing commas               |
| `task_2` | medium     | JOIN references columns that don't exist |
| `task_3` | hard       | Aggregate query missing GROUP BY         |

Each task gives the agent the schema, the broken query, the runtime error
(if any), and a one-line hint. The agent submits a corrected query via the
`/step` endpoint and is scored on whether the result rows match the
canonical expected rows.

## Architecture

```text
.
├── pyproject.toml         # uv project, server entry point
├── uv.lock                # uv lockfile
├── Dockerfile             # builds the FastAPI server image
├── README.md              # GitHub + HF Space landing document
├── inference.py           # AGENT — talks to the env via HTTP, calls an LLM
├── openenv.yaml           # OpenEnv metadata
├── server/
│   └── app.py             # FastAPI env server + frontend serving
├── frontend/
│   ├── src/               # Winner UI shell + SQL-specific tabs
│   └── dist/              # prebuilt frontend bundle shipped to HF
├── sql_env/
│   ├── env_core.py        # SQLite-backed env state
│   ├── tasks.py           # Task definitions
│   └── grader.py          # Strict (0, 1) score clamping
└── tests/
    └── test_smoke.py      # Pytest smoke suite
```

## Frontend

The root route `/` serves a deployed frontend command center with:

- `QUERY LAB` for reset, submit, and grader workflows
- `TASK ATLAS` for browsing the three SQL missions
- `BASELINE ARENA` for broken-query score comparisons
- `AGENT PROTOCOL` for validator and runtime notes
- `API OPS` for backend connection and endpoint visibility

In production, the frontend talks to the backend through `/api/*` aliases.
That keeps the Space root usable as both a human-facing app and an API host.

## HTTP API

| Method | Path        | Body                                      | Returns                              |
|--------|-------------|-------------------------------------------|--------------------------------------|
| GET    | `/health`   | —                                         | `{"status":"ok"}`                    |
| GET    | `/tasks`    | —                                         | task list + metadata                 |
| POST   | `/reset`    | `{"task_id":"task_1"}` (optional)         | observation                          |
| POST   | `/step`     | `{"action":{"action_type":"submit_query","query":"..."}}` | observation/reward/done |
| POST   | `/grader`   | `{"task_id":"task_1"}`                    | `{"score": float in (0,1)}`          |
| POST   | `/baseline` | `{"tasks":[...]}` (optional)              | scores for all tasks                 |

`/reset` accepts an empty body and defaults to `task_1` — required by the
OpenEnv validator.

The frontend calls the equivalent `/api/health`, `/api/tasks`, `/api/reset`,
`/api/step`, `/api/grader`, and `/api/baseline` aliases.

## Running locally

```bash
# 1. Install backend dependencies
uv sync

# 2. Build the frontend bundle used by the HF Space
cd frontend
npm ci
npm run build
cd ..

# 3. Start the env server
python -m server.app          # serves API + frontend at http://localhost:8000

# 4. Optional: frontend-only dev mode
cd frontend
npm run dev

# 5. Run the agent (in another terminal)
export HF_TOKEN=<your-groq-or-openai-key>
export API_BASE_URL=https://api.groq.com/openai/v1
export MODEL_NAME=llama-3.3-70b-versatile
ENV_URL=http://localhost:8000 uv run python inference.py
```

## Example API Flow

```bash
URL=https://krishpotanwar-sql-repair-env.hf.space

curl -s "$URL/health"
curl -s -X POST "$URL/reset" -H "Content-Type: application/json" -d '{}'
curl -s -X POST "$URL/step" \
  -H "Content-Type: application/json" \
  -d '{"action":{"action_type":"submit_query","query":"SELECT id, name, price FROM products ORDER BY id"}}'
curl -s -X POST "$URL/grader" -H "Content-Type: application/json" -d '{"task_id":"task_1"}'
curl -s -X POST "$URL/baseline" -H "Content-Type: application/json" -d '{}'
```

## Inference Output Notes

`inference.py` is designed to keep stdout validator-safe:

- Every task emits exactly one `[START]` line
- Every task emits exactly one `[END]` line with `score=` strictly in `(0, 1)`
- On missing-key or fatal fallback paths, the score falls back to `0.5000`
- Successful runs may also emit `[STEP]` progress lines

Example no-key path:

```text
[START] task_1
[END] task_1 | score=0.5000 | status=fatal_no_llm
[START] task_2
[END] task_2 | score=0.5000 | status=fatal_no_llm
[START] task_3
[END] task_3 | score=0.5000 | status=fatal_no_llm
```

## Environment variables

| Name               | Default                                  | Notes                                       |
|--------------------|------------------------------------------|---------------------------------------------|
| `API_BASE_URL`     | `https://api.groq.com/openai/v1`         | Required by OpenEnv submission checklist    |
| `MODEL_NAME`       | `llama-3.3-70b-versatile`                | Required by OpenEnv submission checklist    |
| `HF_TOKEN`         | (none — must be set in HF Space Secrets) | Required by OpenEnv submission checklist    |
| `LOCAL_IMAGE_NAME` | (unset)                                  | If set, inference.py boots a Docker image   |
| `ENV_URL`          | `http://localhost:8000`                  | Where the env server is reachable           |

## Validation

```bash
# Phase 1 — official OpenEnv validator
uvx --from openenv-core openenv validate .

# Backend smoke tests
uv run pytest tests/ -q

# Frontend lint
cd frontend && npm run lint
```

No API keys are hardcoded in this repo. The agent reads `HF_TOKEN` (with
optional `GROQ_API_KEY` and `OPENAI_API_KEY` fallbacks) at runtime only.
