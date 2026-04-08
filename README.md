# SQL Repair OpenEnv

An OpenEnv environment for the **Meta PyTorch x Scaler hackathon** where
agents repair broken SQL queries against a small SQLite schema.

## Tasks

| ID       | Difficulty | What's broken                                  |
|----------|------------|------------------------------------------------|
| `task_1` | easy       | SELECT list missing commas                     |
| `task_2` | medium     | JOIN references columns that don't exist       |
| `task_3` | hard       | Aggregate query missing GROUP BY               |

Each task gives the agent the schema, the broken query, the runtime error
(if any), and a one-line hint. The agent submits a corrected query via the
`/step` endpoint and is scored on whether the result rows match the
canonical expected rows.

## Architecture

```
.
├── pyproject.toml         # uv project, server entry point
├── uv.lock                # uv lockfile
├── Dockerfile             # builds the env server image
├── inference.py           # AGENT — talks to the env via HTTP, calls an LLM
├── openenv.yaml           # OpenEnv metadata
├── server/
│   └── app.py             # FastAPI env server (def main)
├── sql_env/
│   ├── env_core.py        # SQLite-backed env state
│   ├── tasks.py           # Task definitions
│   └── grader.py          # Strict (0, 1) score clamping
└── tests/
    └── test_smoke.py      # Pytest smoke suite
```

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

## Running locally

```bash
# 1. Install
uv sync                       # or: pip install -e . && pip install -r requirements.txt

# 2. Start the env server
python -m server.app          # listens on http://localhost:8000

# 3. Run the agent (in another terminal)
export HF_TOKEN=<your-groq-or-openai-key>
export API_BASE_URL=https://api.groq.com/openai/v1
export MODEL_NAME=llama-3.3-70b-versatile
python inference.py
```

Expected output:

```
[START] task_1
[STEP] 01 | task=task_1 | action=submit_query | reward=+1.0000 | matches=True | rows=5
[END] task_1 | score=0.9890 | status=ok
[START] task_2
...
```

## Environment variables

| Name             | Default                                  | Notes                                       |
|------------------|------------------------------------------|---------------------------------------------|
| `API_BASE_URL`   | `https://api.groq.com/openai/v1`         | Required by OpenEnv submission checklist    |
| `MODEL_NAME`     | `llama-3.3-70b-versatile`                | Required by OpenEnv submission checklist    |
| `HF_TOKEN`       | (none — must be set in HF Space Secrets) | Required by OpenEnv submission checklist    |
| `LOCAL_IMAGE_NAME` | (unset)                                | If set, inference.py boots a Docker image   |
| `ENV_URL`        | `http://localhost:8000`                  | Where the env server is reachable           |

## Validation

```bash
# Phase 1 — official OpenEnv validator
uvx --from openenv-core openenv validate .

# Smoke tests
python -m pytest tests/ -q
```

No API keys are hardcoded in this repo. The agent reads `HF_TOKEN` (with
optional `GROQ_API_KEY`/`OPENAI_API_KEY` fallbacks) at runtime only.
