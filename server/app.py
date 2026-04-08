"""FastAPI server for the SQL Repair OpenEnv environment.

Endpoints (all required by the OpenEnv submission validator):
  GET  /health   -> {"status": "ok"}
  GET  /tasks    -> {"tasks": ["task_1", "task_2", "task_3"]}
  POST /reset    -> reset env to a task (body optional, defaults to task_1)
  POST /step     -> apply an action, return observation/reward/done
  POST /grader   -> compute final score for a task (strictly in (0, 1))
  POST /baseline -> run all tasks with the broken queries, return scores

Phase 1 hard requirement: /reset MUST accept an empty POST body.
We achieve that with `Optional[ResetRequest] = Body(default=None)`.

Entry point exposed via [project.scripts] server = "server.app:main".
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from fastapi import Body, FastAPI
from pydantic import BaseModel, Field

from sql_env.env_core import EnvState, MAX_STEPS
from sql_env.grader import grade_task
from sql_env.tasks import TASK_IDS, TASKS

app = FastAPI(
    title="SQL Repair OpenEnv",
    version="0.1.0",
    description=(
        "An OpenEnv environment for SQL query repair. Agents fix broken "
        "SQL queries against a small SQLite schema."
    ),
)

# Single mutable env state instance — the validator runs one session.
_state = EnvState()


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------
class ResetRequest(BaseModel):
    task_id: Optional[str] = Field(default=None, description="Task ID to reset to")


class StepAction(BaseModel):
    action_type: str = Field(default="submit_query")
    query: str = Field(default="")


class StepRequest(BaseModel):
    action: Dict[str, Any] = Field(default_factory=dict)


class GraderRequest(BaseModel):
    task_id: Optional[str] = Field(default=None)


class BaselineRequest(BaseModel):
    tasks: Optional[List[str]] = Field(default=None)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/tasks")
def list_tasks() -> Dict[str, Any]:
    return {
        "tasks": TASK_IDS,
        "details": [
            {
                "id": TASKS[t]["id"],
                "name": TASKS[t]["name"],
                "difficulty": TASKS[t]["difficulty"],
            }
            for t in TASK_IDS
        ],
    }


@app.post("/reset")
def reset(req: Optional[ResetRequest] = Body(default=None)) -> Dict[str, Any]:
    """Reset the environment. Body is optional — defaults to task_1."""
    task_id = req.task_id if (req and req.task_id) else "task_1"
    obs = _state.reset(task_id)
    return obs


@app.post("/step")
def step(req: Optional[StepRequest] = Body(default=None)) -> Dict[str, Any]:
    """Apply one action to the environment."""
    action: Dict[str, Any] = (req.action if req and req.action else {})
    return _state.step(action)


@app.post("/grader")
def grader(req: Optional[GraderRequest] = Body(default=None)) -> Dict[str, Any]:
    """Return the strict-(0,1) score for the given task."""
    task_id = req.task_id if (req and req.task_id) else (_state.task_id or "task_1")
    score = grade_task(_state, task_id)
    return {"task_id": task_id, "score": float(score)}


@app.post("/baseline")
def baseline(
    req: Optional[BaselineRequest] = Body(default=None),
) -> Dict[str, Any]:
    """Run all tasks with the broken queries to verify graders work."""
    task_ids = (req.tasks if (req and req.tasks) else None) or list(TASK_IDS)
    out: Dict[str, float] = {}
    for tid in task_ids:
        if tid not in TASKS:
            continue
        local = EnvState()
        local.reset(tid)
        # Submit the broken query as a baseline submission
        local.step({"action_type": "submit_query", "query": TASKS[tid]["broken_query"]})
        out[tid] = float(grade_task(local, tid))
    return {"scores": out, "max_steps": MAX_STEPS}


# ---------------------------------------------------------------------------
# Entry point — referenced by [project.scripts] server = "server.app:main"
# ---------------------------------------------------------------------------
def main() -> None:
    """Entry point for `python -m server.app` and the `server` console script."""
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
