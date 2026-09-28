import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { formatPoints } from '../../lib/format'
import { entryLabel, sportLabel } from '../../lib/entries'
import { SECTIONS } from '../../lib/dates'

// Temporary list of the selected day's entries until Heute exists (PLAN.md Phase 2; removed in Phase 3).
export default function DayEntries({ log, onRemove }) {
  const [confirm, setConfirm] = useState(null)
  const entries = log?.entries ?? []
  const sport = log?.sport ?? []
  if (!entries.length && !sport.length) return null

  const sectionLabel = (id) => SECTIONS.find((s) => s.id === id)?.label ?? id
  const total = entries.reduce((sum, e) => sum + e.points, 0)
  const row = 'flex items-center gap-3 border-t border-border py-2.5 first:border-t-0'

  return (
    <section className="mt-8 rounded-card border border-border bg-card px-4 py-2">
      <h2 className="flex justify-between py-2 text-sm font-bold text-muted">
        <span>Einträge des Tages</span>
        <span>{formatPoints(total)} Pkt.</span>
      </h2>
      {entries.map((e) => (
        <div key={e.id} className={row}>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{entryLabel(e)}</span>
            <span className="block text-xs text-muted">{sectionLabel(e.section)}</span>
          </span>
          <span className="font-semibold tabular-nums">{formatPoints(e.points)}</span>
          <button type="button" onClick={() => setConfirm({ field: 'entries', id: e.id })} aria-label="Löschen" className="rounded-full p-1.5 text-muted active:bg-border">
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      {sport.map((s) => (
        <div key={s.id} className={row}>
          <span className="min-w-0 flex-1">
            <span className="block truncate">{sportLabel(s)}</span>
            <span className="block text-xs text-muted">Aktivität</span>
          </span>
          <span className="font-semibold text-primary tabular-nums">{formatPoints(-s.points)}</span>
          <button type="button" onClick={() => setConfirm({ field: 'sport', id: s.id })} aria-label="Löschen" className="rounded-full p-1.5 text-muted active:bg-border">
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      {confirm && (
        <ConfirmDialog
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            onRemove(confirm)
            setConfirm(null)
          }}
        />
      )}
    </section>
  )
}
