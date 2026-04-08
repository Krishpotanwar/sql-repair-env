import { useEffect, useMemo, useState } from 'react'
import { fetchBaseline } from '../api/client'
import { TASK_CATALOG } from '../data/taskCatalog'
import type { BaselineResponse } from '../types'
import { SectionCard } from './SectionCard'

const IDEAL_SCORE = 0.99

export function BaselineArenaTab() {
  const [baseline, setBaseline] = useState<BaselineResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBaseline = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBaseline()
      setBaseline(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBaseline()
  }, [])

  const entries = useMemo(
    () =>
      Object.entries(baseline?.scores ?? {}).map(([taskId, score]) => ({
        taskId,
        score,
        delta: Number((IDEAL_SCORE - score).toFixed(4)),
      })),
    [baseline],
  )

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Broken-query benchmark"
        title="Baseline arena"
        subtitle="The baseline endpoint runs the intentionally broken SQL for every task so we can inspect score separation."
        actions={
          <button
            onClick={() => void loadBaseline()}
            className="px-3 py-2 rounded-lg text-sm border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60"
          >
            Refresh Baseline
          </button>
        }
      >
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200 mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-sm text-zinc-500">Collecting live baseline scores…</div>
        )}

        {!loading && baseline && (
          <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="space-y-4">
              {entries.map(({ taskId, score, delta }) => (
                <div key={taskId} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{taskId}</p>
                      <h3 className="text-lg font-semibold text-zinc-100 mt-2">
                        {TASK_CATALOG[taskId]?.story}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Score</p>
                      <p className="text-2xl font-semibold text-zinc-100 mt-2">{score.toFixed(4)}</p>
                    </div>
                  </div>

                  <div className="h-3 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                      style={{ width: `${Math.max(6, score * 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-zinc-500 mt-3">
                    Gap to a near-perfect solve: <span className="mono">{delta.toFixed(4)}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Grader formula</p>
                <ul className="space-y-2 text-sm text-zinc-200 leading-7">
                  <li>0.05 for submitting any query</li>
                  <li>0.25 when the last query executes without error</li>
                  <li>0.60 when the result matches the expected rows</li>
                  <li>0.09 efficiency bonus for faster perfect solves</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/8 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Why this matters</p>
                <p className="text-sm text-cyan-100 leading-7">
                  The scores stay strictly inside the open interval (0, 1), while still leaving
                  enough spread between broken-query baselines and reference solves for the
                  validator to tell them apart.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/8 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Max steps</p>
                <p className="text-3xl font-semibold text-zinc-100">{baseline.max_steps}</p>
                <p className="text-sm text-zinc-300 leading-7 mt-2">
                  Every task shares the same step ceiling, which keeps grading and agent runtime
                  predictable for the OpenEnv portal.
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
