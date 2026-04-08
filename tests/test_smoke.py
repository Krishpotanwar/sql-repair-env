"""Smoke tests for the SQL Repair env.

Run with: python -m pytest tests/ -q
"""
from __future__ import annotations

import math

from sql_env.env_core import EnvState, MAX_STEPS
from sql_env.grader import SCORE_MAX, SCORE_MIN, grade_task, strict_clamp
from sql_env.tasks import TASK_IDS, TASKS


# ---------------------------------------------------------------------------
# Strict (0, 1) clamp invariants
# ---------------------------------------------------------------------------
def test_strict_clamp_handles_extremes():
    assert strict_clamp(0.0) == SCORE_MIN
    assert strict_clamp(-1.0) == SCORE_MIN
    assert strict_clamp(1.0) == SCORE_MAX
    assert strict_clamp(2.0) == SCORE_MAX
    assert strict_clamp(float("nan")) == 0.5
    assert strict_clamp(float("inf")) == 0.5
    assert strict_clamp(float("-inf")) == 0.5
    assert strict_clamp("not a number") == 0.5
    assert strict_clamp(None) == 0.5


def test_strict_clamp_passes_through_in_range():
    for v in [0.001, 0.1, 0.5, 0.7234, 0.999]:
        out = strict_clamp(v)
        assert SCORE_MIN <= out <= SCORE_MAX
        assert 0.0 < out < 1.0


# ---------------------------------------------------------------------------
# Each canonical query reproduces the expected rows
# ---------------------------------------------------------------------------
def test_canonical_queries_solve_their_tasks():
    for tid in TASK_IDS:
        s = EnvState()
        s.reset(tid)
        result = s.step(
            {"action_type": "submit_query", "query": TASKS[tid]["canonical_query"]}
        )
        assert result["info"]["solved"] is True, f"{tid} canonical did not solve"
        assert result["reward"] == 1.0
        score = grade_task(s, tid)
        assert SCORE_MIN <= score <= SCORE_MAX
        assert score >= 0.85, f"{tid} canonical scored too low: {score}"


# ---------------------------------------------------------------------------
# Broken queries do not solve and grade in (0, 1)
# ---------------------------------------------------------------------------
def test_broken_queries_score_in_range_but_not_solved():
    for tid in TASK_IDS:
        s = EnvState()
        s.reset(tid)
        result = s.step(
            {"action_type": "submit_query", "query": TASKS[tid]["broken_query"]}
        )
        assert result["info"]["solved"] is False
        score = grade_task(s, tid)
        assert SCORE_MIN <= score <= SCORE_MAX
        assert 0.0 < score < 1.0


# ---------------------------------------------------------------------------
# A do-nothing run still produces an in-range score
# ---------------------------------------------------------------------------
def test_no_submission_scores_in_range():
    for tid in TASK_IDS:
        s = EnvState()
        s.reset(tid)
        score = grade_task(s, tid)
        assert SCORE_MIN <= score <= SCORE_MAX
        assert 0.0 < score < 1.0


# ---------------------------------------------------------------------------
# Step limit terminates
# ---------------------------------------------------------------------------
def test_step_limit_done():
    s = EnvState()
    s.reset("task_1")
    for _ in range(MAX_STEPS):
        result = s.step({"action_type": "submit_query", "query": "SELECT 1"})
    assert result["done"] is True


# ---------------------------------------------------------------------------
# Reset accepts unknown task_id by falling back to task_1
# ---------------------------------------------------------------------------
def test_reset_unknown_task_falls_back():
    s = EnvState()
    obs = s.reset("nonexistent_task")
    assert obs["task_id"] == "task_1"


# ---------------------------------------------------------------------------
# Empty action does not crash
# ---------------------------------------------------------------------------
def test_empty_action_handled():
    s = EnvState()
    s.reset("task_1")
    result = s.step({})
    assert "observation" in result
    assert result["reward"] <= 0  # negative or zero reward
    assert result["observation"]["error"]
