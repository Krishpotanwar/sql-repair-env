"""SQLite-backed environment state for SQL repair tasks.

The env exposes a minimal Gym-like API:
  reset(task_id) -> observation dict
  step(action)   -> {observation, reward, done, info}

Per-task state is held in this single instance for simplicity. The
validator only needs one parallel run.
"""
from __future__ import annotations

import sqlite3
from typing import Any, Dict, List, Optional

from .tasks import TASKS, TASK_IDS

MAX_STEPS = 6


def _new_db(task_id: str) -> sqlite3.Connection:
    """Build a fresh in-memory DB for the given task."""
    if task_id not in TASKS:
        raise KeyError(f"Unknown task_id: {task_id}")
    conn = sqlite3.connect(":memory:")
    cur = conn.cursor()
    for stmt in TASKS[task_id]["schema"]:
        cur.execute(stmt)
    conn.commit()
    return conn


def _run_query(task_id: str, query: str) -> Dict[str, Any]:
    """Execute a query against a fresh DB; return rows or error info."""
    conn = _new_db(task_id)
    try:
        cur = conn.execute(query)
        rows = cur.fetchall()
        col_names = [d[0] for d in cur.description] if cur.description else []
        return {"ok": True, "rows": rows, "columns": col_names, "error": None}
    except Exception as exc:
        return {"ok": False, "rows": None, "columns": [], "error": str(exc)}
    finally:
        conn.close()


def _expected_rows(task_id: str) -> List[tuple]:
    """Compute the canonical (expected) result set for a task."""
    res = _run_query(task_id, TASKS[task_id]["canonical_query"])
    if not res["ok"]:
        # Should never happen — canonical queries are vetted in tests.
        raise RuntimeError(
            f"Canonical query for {task_id} failed: {res['error']}"
        )
    return res["rows"]


class EnvState:
    """Mutable per-session env state. One instance handles all tasks."""

    def __init__(self) -> None:
        self.task_id: Optional[str] = None
        self.step_count: int = 0
        self.last_query: Optional[str] = None
        self.last_error: Optional[str] = None
        self.last_result: Optional[List[tuple]] = None
        self.solved: bool = False
        self.expected_rows: List[tuple] = []
        self.expected_columns: int = 0

    # ------------------------------------------------------------------
    def reset(self, task_id: Optional[str] = None) -> Dict[str, Any]:
        tid = task_id or "task_1"
        if tid not in TASKS:
            tid = "task_1"
        task = TASKS[tid]

        self.task_id = tid
        self.step_count = 0
        self.last_query = None
        self.last_error = None
        self.last_result = None
        self.solved = False
        self.expected_rows = _expected_rows(tid)
        self.expected_columns = (
            len(self.expected_rows[0]) if self.expected_rows else 0
        )

        # Surface what the broken query actually does, so the agent has
        # an error message and a canonical "what went wrong" hint.
        baseline = _run_query(tid, task["broken_query"])

        return {
            "task_id": tid,
            "name": task["name"],
            "difficulty": task["difficulty"],
            "schema_sql": "\n".join(task["schema"]),
            "broken_query": task["broken_query"],
            "broken_query_error": baseline["error"],
            "broken_query_executes": baseline["ok"],
            "hint": task["hint"],
            "expected_row_count": len(self.expected_rows),
            "expected_column_count": self.expected_columns,
            "step_count": 0,
            "max_steps": MAX_STEPS,
            "remaining_steps": MAX_STEPS,
        }

    # ------------------------------------------------------------------
    def step(self, action: Dict[str, Any]) -> Dict[str, Any]:
        if self.task_id is None:
            return {
                "observation": {"error": "No active task. Call /reset first."},
                "reward": 0.0,
                "done": True,
                "info": {"solved": False, "no_active_task": True},
            }

        self.step_count += 1
        action_type = (action or {}).get("action_type", "submit_query")
        query = ((action or {}).get("query") or "").strip()
        self.last_query = query

        reward = 0.0
        result_rows: Optional[List[tuple]] = None
        error: Optional[str] = None

        if action_type != "submit_query":
            error = f"Unsupported action_type: {action_type}"
            reward = -0.05
        elif not query:
            error = "Empty query string."
            reward = -0.05
        else:
            res = _run_query(self.task_id, query)
            if res["ok"]:
                result_rows = res["rows"]
                self.last_result = result_rows
                self.last_error = None
                if result_rows == self.expected_rows:
                    reward = 1.0
                    self.solved = True
                else:
                    # executed but wrong rows — small positive reward
                    reward = 0.4
            else:
                error = res["error"]
                self.last_error = error
                self.last_result = None
                reward = -0.10

        done = self.solved or self.step_count >= MAX_STEPS

        observation = {
            "task_id": self.task_id,
            "step_count": self.step_count,
            "submitted_query": query,
            "error": error,
            "executed": error is None and result_rows is not None,
            "matches_expected": (
                result_rows == self.expected_rows if result_rows is not None else False
            ),
            "result_row_count": len(result_rows) if result_rows is not None else 0,
            "expected_row_count": len(self.expected_rows),
            "result_preview": result_rows[:3] if result_rows else None,
            "expected_preview": self.expected_rows[:3],
            "remaining_steps": max(0, MAX_STEPS - self.step_count),
        }

        return {
            "observation": observation,
            "reward": float(reward),
            "done": bool(done),
            "info": {"solved": self.solved},
        }
