"""Strict (0, 1) grader for SQL repair tasks.

Phase 2 hard requirement: scores MUST be in the OPEN interval (0, 1).
Validator rejects exactly 0.0 and exactly 1.0. NaN/inf are also rejected,
so we coerce them to 0.5 (a neutral, in-range fallback).
"""
from __future__ import annotations

import math
from typing import Any

# Module-level constants — also used by inference.py for consistency.
SCORE_MIN: float = 1e-3   # 0.001 — strictly > 0
SCORE_MAX: float = 0.999  # strictly < 1


def strict_clamp(value: Any) -> float:
    """Coerce any input into a float strictly inside (0, 1).

    NaN, inf, -inf, and non-numeric inputs all collapse to 0.5.
    """
    try:
        s = float(value)
    except (TypeError, ValueError):
        return 0.5
    if math.isnan(s) or math.isinf(s):
        return 0.5
    if s <= 0.0:
        return SCORE_MIN
    if s >= 1.0:
        return SCORE_MAX
    return round(s, 4)


def grade_task(state, task_id: str) -> float:
    """Score the current state of an EnvState for the given task.

    Score components (sum, then strict_clamp):
      - 0.05  : agent submitted at least one query
      - 0.25  : last query executed without error
      - 0.60  : result rows matched expected rows
      - 0.09  : efficiency bonus (faster solves score higher)

    Worst case (no submission):    0.000  -> clamped to 0.001
    Best case (1-step solve):      0.99   -> clamped to 0.99
    Wrong-result executes:         0.30   -> in range
    """
    from .env_core import MAX_STEPS  # local import avoids circular

    if state.task_id != task_id:
        return SCORE_MIN

    raw = 0.0
    if state.last_query:
        raw += 0.05
    if state.last_error is None and state.last_result is not None:
        raw += 0.25
    if state.last_result == state.expected_rows and state.expected_rows:
        raw += 0.60
    if state.solved and state.step_count > 0:
        bonus = 0.09 * max(0, MAX_STEPS - state.step_count) / MAX_STEPS
        raw += bonus

    return strict_clamp(raw)
