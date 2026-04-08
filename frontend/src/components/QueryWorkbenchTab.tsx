import { useCallback, useEffect, useMemo, useState } from 'react'
import { gradeTask, resetTask, submitQuery } from '../api/client'
import { TASK_CATALOG } from '../data/taskCatalog'
import type { ApiInfo, GraderResponse, StepResponse, TaskInfo, TaskObservation } from '../types'
import { SectionCard } from './SectionCard'
import { SqlPreviewTable } from './SqlPreviewTable'

interface QueryWorkbenchTabProps {
  selectedTask: string
  taskInfo?: TaskInfo
  apiInfo: ApiInfo
}

function scoreTone(score: number | null) {
  if (score === null) return 'text-zinc-400'
  if (score >= 0.9) return 'text-emerald-300'
  if (score >= 0.3) return 'text-amber-300'
  return 'text-rose-300'
}

export function QueryWorkbenchTab({
  selectedTask,
  taskInfo,
  apiInfo,
}: QueryWorkbenchTabProps) {
  const [task, setTask] = useState<TaskObservation | null>(null)
  const [query, setQuery] = useState('')
  const [grader, setGrader] = useState<GraderResponse | null>(null)
  const [stepResult, setStepResult] = useState<StepResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const catalogEntry = TASK_CATALOG[selectedTask]

  const loadTask = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextTask = await resetTask(selectedTask)
      setTask(nextTask)
      setQuery(nextTask.broken_query)
      setStepResult(null)
      setGrader(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setLoading(false)
    }
  }, [selectedTask])

  useEffect(() => {
    void loadTask()
  }, [loadTask])

  const mergedObservation = useMemo(() => {
    if (!task) return null
    if (!stepResult) return task
    return { ...task, ...stepResult.observation }
  }, [stepResult, task])

  const runQuery = async (nextQuery: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await submitQuery(nextQuery)
      setStepResult(response)
      setTask((current) => (current ? { ...current, ...response.observation } : response.observation))
      const nextScore = await gradeTask(selectedTask)
      setGrader(nextScore)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : String(runError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <SectionCard
          eyebrow="Case File"
          title={taskInfo?.name ?? selectedTask}
          subtitle="The environment resets on every task change and tracks a single active SQL repair session."
          actions={
            <button
              onClick={() => void loadTask()}
              className="px-3 py-2 rounded-lg text-sm border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60"
            >
              Reset Task
            </button>
          }
        >
          {mergedObservation ? (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Difficulty</p>
                  <p className="text-lg font-semibold mt-2 text-zinc-100">{mergedObservation.difficulty}</p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Expected Shape</p>
                  <p className="text-lg font-semibold mt-2 text-zinc-100">
                    {mergedObservation.expected_row_count} × {mergedObservation.expected_column_count}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Current Score</p>
                  <p className={`text-lg font-semibold mt-2 ${scoreTone(grader?.score ?? null)}`}>
                    {grader ? grader.score.toFixed(4) : '—'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Hint</p>
                <p className="text-sm leading-7 text-zinc-200">{mergedObservation.hint}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Broken Query</p>
                <pre className="mono text-sm rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 overflow-auto text-rose-200 whitespace-pre-wrap">
                  {mergedObservation.broken_query}
                </pre>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Schema</p>
                <pre className="mono text-sm rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 overflow-auto text-zinc-200 whitespace-pre-wrap">
                  {mergedObservation.schema_sql}
                </pre>
              </div>

              {mergedObservation.broken_query_error && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-4 text-sm text-amber-100">
                  Baseline error: <span className="mono">{mergedObservation.broken_query_error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Loading task snapshot…</div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Repair Workbench"
          title="Submit and score candidate fixes"
          subtitle="Use the same reset/step/grader flow that the validator exercises on the live Space."
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setQuery(task?.broken_query ?? '')}
                className="px-3 py-2 rounded-lg text-sm border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60"
              >
                Load Broken Query
              </button>
              <button
                onClick={() => setQuery(catalogEntry?.canonicalQuery ?? '')}
                className="px-3 py-2 rounded-lg text-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
              >
                Load Reference Fix
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck={false}
              className="w-full min-h-[220px] rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-sm text-zinc-100 mono focus:outline-none focus:border-cyan-500/40"
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void runQuery(query)}
                disabled={loading}
                className="px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 disabled:opacity-60"
              >
                {loading ? 'Executing…' : 'Submit Current Query'}
              </button>
              <button
                onClick={() => void loadTask()}
                disabled={loading}
                className="px-4 py-3 rounded-xl text-sm border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 disabled:opacity-60"
              >
                Reset Session
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Reward</p>
                <p className="text-2xl font-semibold text-zinc-100">
                  {stepResult ? stepResult.reward.toFixed(2) : '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Solved</p>
                <p className="text-2xl font-semibold text-zinc-100">
                  {stepResult ? (stepResult.info.solved ? 'YES' : 'NO') : '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">API Mode</p>
                <p className="text-sm font-semibold text-zinc-100">{apiInfo.mode}</p>
                <p className="text-xs text-zinc-500 mt-1 mono">{apiInfo.base}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Result Preview</p>
                <SqlPreviewTable
                  emptyLabel="Run a query to inspect the first rows returned by SQLite."
                  rows={mergedObservation?.result_preview}
                />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Expected Preview</p>
                <SqlPreviewTable
                  emptyLabel="Expected rows will appear after the task loads."
                  rows={mergedObservation?.expected_preview}
                />
              </div>
            </div>

            {catalogEntry && (
              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/8 px-4 py-4 text-sm text-cyan-100">
                <p className="font-semibold mb-2">Reference validation signal</p>
                <p className="leading-7">{catalogEntry.validationSignal}</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
