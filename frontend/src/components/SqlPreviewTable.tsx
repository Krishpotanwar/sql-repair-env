import type { SqlRow } from '../types'

interface SqlPreviewTableProps {
  rows?: SqlRow[] | null
  emptyLabel: string
}

function formatCell(cell: SqlRow[number]) {
  if (cell === null) return 'NULL'
  if (typeof cell === 'number') return Number.isInteger(cell) ? cell.toString() : cell.toFixed(2)
  return String(cell)
}

export function SqlPreviewTable({ rows, emptyLabel }: SqlPreviewTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-6 text-sm text-zinc-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="odd:bg-zinc-950/60 even:bg-zinc-900/60">
              <td className="px-3 py-2 text-zinc-500 border-r border-zinc-800 mono w-12">{rowIndex}</td>
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className="px-3 py-2 border-r border-zinc-800/80 last:border-r-0 text-zinc-100 mono"
                >
                  {formatCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
