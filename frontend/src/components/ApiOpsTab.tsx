import { TASK_CATALOG } from '../data/taskCatalog'
import type { ApiInfo, HealthStatus, TaskInfo } from '../types'
import { SectionCard } from './SectionCard'

interface ApiOpsTabProps {
  health: HealthStatus
  apiInfo: ApiInfo
  selectedTask: string
  taskInfo?: TaskInfo
}

export function ApiOpsTab({
  health,
  apiInfo,
  selectedTask,
  taskInfo,
}: ApiOpsTabProps) {
  const canonicalQuery = TASK_CATALOG[selectedTask]?.canonicalQuery ?? 'SELECT 1'

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Operations"
        title="API ops + live endpoints"
        subtitle="The frontend talks to Winner through `/api/*` in production, while the backend still exposes the original canonical OpenEnv routes."
      >
        <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Live status</p>
              <div className="space-y-2 text-sm">
                <p className="text-zinc-200">Health state: <span className="mono">{health}</span></p>
                <p className="text-zinc-200">API mode: <span className="mono">{apiInfo.mode}</span></p>
                <p className="text-zinc-200">Base path: <span className="mono">{apiInfo.base}</span></p>
                <p className="text-zinc-200">Focused task: <span className="mono">{taskInfo?.name ?? selectedTask}</span></p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Endpoints</p>
              <div className="space-y-2 text-sm text-zinc-200 mono">
                <div>GET /health</div>
                <div>GET /tasks</div>
                <div>POST /reset</div>
                <div>POST /step</div>
                <div>POST /grader</div>
                <div>POST /baseline</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/8 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Canonical smoke test</p>
              <pre className="mono text-xs leading-6 text-cyan-100 whitespace-pre-wrap">
{`curl -sS https://krishpotanwar-sql-repair-env.hf.space/health
curl -sS -X POST https://krishpotanwar-sql-repair-env.hf.space/reset \\
  -H "Content-Type: application/json" \\
  -d '{"task_id":"${selectedTask}"}'
curl -sS -X POST https://krishpotanwar-sql-repair-env.hf.space/step \\
  -H "Content-Type: application/json" \\
  -d '{"action":{"type":"submit_query","query":"${canonicalQuery}"}}'`}
              </pre>
            </div>

            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/8 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Docs</p>
              <p className="text-sm text-zinc-200 leading-7">
                FastAPI still exposes Swagger docs at <span className="mono">/docs</span>. The
                HF App tab now serves a proper root UI at <span className="mono">/</span>, while
                preserving the canonical OpenEnv API for the validator.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
