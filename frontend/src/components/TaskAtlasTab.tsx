import { TASK_CATALOG } from '../data/taskCatalog'
import type { TaskInfo } from '../types'
import { SectionCard } from './SectionCard'

interface TaskAtlasTabProps {
  tasks: TaskInfo[]
  selectedTask: string
  onSelectTask: (taskId: string) => void
}

export function TaskAtlasTab({ tasks, selectedTask, onSelectTask }: TaskAtlasTabProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Mission Catalog"
        title="All SQL repair tasks"
        subtitle="Winner-specific task cards built on top of the copied DisasterMan console shell."
      >
        <div className="grid xl:grid-cols-3 gap-5">
          {tasks.map((task) => {
            const catalog = TASK_CATALOG[task.id]
            const isSelected = task.id === selectedTask

            return (
              <article
                key={task.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  isSelected
                    ? 'border-emerald-400/40 bg-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-950/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{task.id}</p>
                    <h3 className="text-lg font-semibold mt-2 text-zinc-100">{task.name}</h3>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] border border-zinc-700 text-zinc-300">
                    {task.difficulty}
                  </span>
                </div>

                <p className="text-sm leading-7 text-zinc-300 mb-4">{catalog?.story}</p>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Why it fails</p>
                    <p className="leading-7 text-zinc-200">{catalog?.whyItFails}</p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Schema snapshot</p>
                    <pre className="mono text-xs rounded-xl border border-zinc-800 bg-black/40 px-3 py-3 whitespace-pre-wrap overflow-auto text-zinc-300">
                      {catalog?.schemaStatements.slice(0, 4).join('\n')}
                    </pre>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-2">Reference fix</p>
                    <pre className="mono text-xs rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-3 whitespace-pre-wrap overflow-auto text-emerald-100">
                      {catalog?.canonicalQuery}
                    </pre>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTask(task.id)}
                  className="mt-5 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-semibold text-sm"
                >
                  Open in Query Lab
                </button>
              </article>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
