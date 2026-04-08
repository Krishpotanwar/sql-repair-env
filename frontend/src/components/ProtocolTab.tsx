import { SectionCard } from './SectionCard'

const stdoutContract = `[START] task_1
[END] task_1 | score=0.5000 | status=fatal_no_llm
[START] task_2
[END] task_2 | score=0.5000 | status=fatal_no_llm
[START] task_3
[END] task_3 | score=0.5000 | status=fatal_no_llm`

export function ProtocolTab() {
  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Inference contract"
        title="Agent protocol"
        subtitle="Winner’s extra protocol pages document the exact validator assumptions that came out of the hackathon debugging cycle."
      >
        <div className="grid xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Environment variables</p>
              <ul className="space-y-2 text-sm text-zinc-200 mono">
                <li>API_BASE_URL</li>
                <li>MODEL_NAME</li>
                <li>HF_TOKEN</li>
                <li>LOCAL_IMAGE_NAME (optional)</li>
                <li>ENV_URL (optional for local replay)</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Scoring guardrails</p>
              <ul className="space-y-2 text-sm text-zinc-200 leading-7">
                <li>Scores are clamped after rounding to avoid `0.0000` and `1.0000` leaks.</li>
                <li>NaN, inf, and non-numeric paths collapse to `0.5`.</li>
                <li>Every task emits exactly one `[START]` and one `[END]` line.</li>
                <li>No stray stdout floats are allowed outside the score field.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/8 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">No-key stdout example</p>
            <pre className="mono text-xs leading-6 text-emerald-100 whitespace-pre-wrap">
              {stdoutContract}
            </pre>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Validator checklist"
        title="What the portal expects"
        subtitle="This page mirrors the checks we had to satisfy before the Winner Space became portal-ready."
      >
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            'GET /health returns 200',
            'POST /reset accepts an empty body',
            'POST /step returns reward and done state',
            'POST /grader emits a score strictly inside (0, 1)',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-200">
              {item}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
