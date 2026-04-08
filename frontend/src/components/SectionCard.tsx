import clsx from 'clsx'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  eyebrow?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  eyebrow,
  subtitle,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={clsx('glass-panel rounded-2xl overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-zinc-800/80 flex items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.26em] text-zinc-500 mb-2">
              {eyebrow}
            </p>
          )}
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
