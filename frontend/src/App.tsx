import { startTransition, useEffect, useMemo, useState } from 'react'
import { ApiError, fetchHealth, fetchTasks, getApiInfo } from './api/client'
import { ApiOpsTab } from './components/ApiOpsTab'
import { BaselineArenaTab } from './components/BaselineArenaTab'
import { ProtocolTab } from './components/ProtocolTab'
import { QueryWorkbenchTab } from './components/QueryWorkbenchTab'
import { SqlLandingPage } from './components/SqlLandingPage'
import { TaskAtlasTab } from './components/TaskAtlasTab'
import type { HealthStatus, TaskInfo } from './types'

type Tab = 'lab' | 'atlas' | 'baseline' | 'protocol' | 'ops'

const TAB_LABELS: Record<Tab, string> = {
  lab: 'QUERY LAB',
  atlas: 'TASK ATLAS',
  baseline: 'BASELINE ARENA',
  protocol: 'AGENT PROTOCOL',
  ops: 'API OPS',
}

const TAB_ICONS: Record<Tab, string> = {
  lab: '⌘',
  atlas: '◫',
  baseline: '▣',
  protocol: '⟟',
  ops: '◌',
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [tab, setTab] = useState<Tab>('lab')
  const [tasks, setTasks] = useState<TaskInfo[]>([])
  const [selectedTask, setSelectedTask] = useState('task_1')
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthStatus>('loading')
  const [healthPayload, setHealthPayload] = useState<string>('Loading…')
  const apiInfo = getApiInfo()

  useEffect(() => {
    void fetchHealth()
      .then((payload) => {
        setHealth(payload.status === 'ok' ? 'ok' : 'error')
        setHealthPayload(JSON.stringify(payload))
      })
      .catch((error: unknown) => {
        setHealth('error')
        setHealthPayload(error instanceof Error ? error.message : String(error))
      })
  }, [])

  useEffect(() => {
    void fetchTasks()
      .then((nextTasks) => {
        setTasks(nextTasks)
        setTasksError(null)
        if (nextTasks.length > 0) {
          startTransition(() => {
            setSelectedTask((current) =>
              nextTasks.some((task) => task.id === current) ? current : nextTasks[0].id,
            )
          })
        }
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setTasksError(`${error.message} (url: ${error.url})`)
          return
        }
        setTasksError(String(error))
      })
  }, [])

  const selectedTaskInfo = useMemo(
    () => tasks.find((task) => task.id === selectedTask),
    [selectedTask, tasks],
  )

  const tabClass = (value: Tab) =>
    `px-5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
      tab === value
        ? 'bg-zinc-800 text-white'
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
    }`

  if (showLanding) {
    return <SqlLandingPage onLaunch={() => setShowLanding(false)} />
  }

  return (
    <div className="min-h-screen text-white flex flex-col relative z-0">
      <header className="border-b border-zinc-800/50 backdrop-blur-3xl bg-black/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.35)]">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-wider bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
                SQL REPAIR COMMAND
              </h1>
              <p className="text-[11px] text-zinc-400 uppercase tracking-widest mt-0.5">
                OpenEnv Query Recovery Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide ${
                health === 'ok'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : health === 'loading'
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {health === 'ok' ? 'SPACE HEALTHY' : health === 'loading' ? 'CHECKING HEALTH' : 'HEALTH WARNING'}
            </div>
            <a
              href="https://github.com/Krishpotanwar/sql-repair-env"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-white transition-colors px-3 py-1.5 border border-zinc-800 rounded-lg"
            >
              GitHub ↗
            </a>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white transition-all px-4 py-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              API Docs ↗
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {(Object.keys(TAB_LABELS) as Tab[]).map((value) => (
            <button key={value} className={tabClass(value)} onClick={() => setTab(value)}>
              <span className="mr-1.5">{TAB_ICONS[value]}</span>
              {TAB_LABELS[value]}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full">
        {tasksError && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-300 text-sm mb-6">
            Could not connect to backend: {tasksError}
            <br />
            <span className="text-xs text-red-500">
              API mode: {apiInfo.mode} | base: {apiInfo.base} | VITE_API_URL: {apiInfo.env}
            </span>
          </div>
        )}

        {!tasksError && tasks.length === 0 && (
          <div className="glass-panel rounded-2xl px-6 py-10 text-zinc-300 text-sm flex items-center justify-center gap-3">
            <span className="animate-spin text-lg">⚙</span>
            Connecting to the SQL task grid…
          </div>
        )}

        {tasks.length > 0 && (
          <>
            <div className="glass-panel rounded-2xl px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Loaded Mission</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {selectedTaskInfo?.name ?? selectedTask}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <label className="text-zinc-400">Current task</label>
                <select
                  value={selectedTask}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    startTransition(() => setSelectedTask(nextValue))
                  }}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                >
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name} ({task.difficulty})
                    </option>
                  ))}
                </select>
                <div className="text-xs text-zinc-500">
                  Live health payload: <span className="mono">{healthPayload}</span>
                </div>
              </div>
            </div>

            {tab === 'lab' && (
              <QueryWorkbenchTab
                apiInfo={apiInfo}
                selectedTask={selectedTask}
                taskInfo={selectedTaskInfo}
              />
            )}
            {tab === 'atlas' && (
              <TaskAtlasTab
                onSelectTask={(taskId) => {
                  startTransition(() => {
                    setSelectedTask(taskId)
                    setTab('lab')
                  })
                }}
                selectedTask={selectedTask}
                tasks={tasks}
              />
            )}
            {tab === 'baseline' && <BaselineArenaTab />}
            {tab === 'protocol' && <ProtocolTab />}
            {tab === 'ops' && (
              <ApiOpsTab
                apiInfo={apiInfo}
                health={health}
                selectedTask={selectedTask}
                taskInfo={selectedTaskInfo}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
