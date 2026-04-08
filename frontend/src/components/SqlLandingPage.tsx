import { motion } from 'framer-motion'
import {
  Activity,
  Braces,
  Database,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'

interface SqlLandingPageProps {
  onLaunch: () => void
}

const featureCards = [
  {
    icon: Database,
    title: 'SQLite-backed task arena',
    copy: 'Each mission spins up a fresh in-memory database so every repair attempt is deterministic and reproducible.',
  },
  {
    icon: ShieldCheck,
    title: 'Strict validator guardrails',
    copy: 'Scores are clamped to the open interval (0, 1) even after rounding, matching the hackathon validator contract.',
  },
  {
    icon: TerminalSquare,
    title: 'Inference protocol ready',
    copy: 'The console mirrors the same reset/step/grader lifecycle that powers the baseline agent and portal checks.',
  },
]

const statusPills = [
  { label: '3 SQL tasks', value: 'easy → hard' },
  { label: '6-step budget', value: 'per task' },
  { label: 'HF Space', value: 'live + healthy' },
]

export function SqlLandingPage({ onLaunch }: SqlLandingPageProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.12),transparent_36%)]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-16"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-emerald-400/30 bg-emerald-500/10 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              <Sparkles className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Winner Project</p>
              <h1 className="text-xl font-semibold">SQL Repair Env</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/docs"
              className="px-4 py-2 text-sm rounded-lg border border-zinc-800 bg-black/30 hover:bg-zinc-900/60 transition-colors"
            >
              Inspect API Docs
            </a>
            <button
              onClick={onLaunch}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 shadow-[0_0_22px_rgba(34,211,238,0.28)]"
            >
              Launch Repair Console
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="glass-panel rounded-[28px] p-8 md:p-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-emerald-200 mb-6">
              <Activity className="w-4 h-4" />
              Live Validation Console
            </div>

            <h2 className="text-4xl md:text-6xl font-semibold leading-[1.02] tracking-tight max-w-3xl">
              Copy the canary’s
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
                command-center energy
              </span>
              for a SQL repair environment.
            </h2>

            <p className="text-zinc-300 text-base md:text-lg leading-8 mt-6 max-w-2xl">
              Winner now ships a proper root UI for Hugging Face Spaces: task explorer, live
              repair workbench, baseline scoring, and the exact agent protocol used by the
              OpenEnv validator.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mt-8">
              {statusPills.map((pill) => (
                <div
                  key={pill.label}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-950/65 px-4 py-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{pill.label}</p>
                  <p className="text-lg font-semibold mt-2 text-zinc-100">{pill.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="space-y-4"
          >
            {featureCards.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="glass-panel rounded-2xl p-5 border border-zinc-800/80"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="text-sm leading-7 text-zinc-300">{copy}</p>
              </div>
            ))}

            <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(9,9,11,0.6))]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-zinc-950/60 border border-amber-400/20 flex items-center justify-center">
                  <Braces className="w-5 h-5 text-amber-200" />
                </div>
                <h3 className="text-lg font-semibold">Validator-safe stdout</h3>
              </div>
              <pre className="mono text-xs leading-6 text-amber-100 whitespace-pre-wrap">
{`[START] task_1
[END] task_1 | score=0.5000 | status=fatal_no_llm
[START] task_2
[END] task_2 | score=0.5000 | status=fatal_no_llm
[START] task_3
[END] task_3 | score=0.5000 | status=fatal_no_llm`}
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
