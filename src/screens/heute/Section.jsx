import { ChevronDown, ChevronUp } from 'lucide-react'

/** Collapsible meal/activity section with a total in the header. */
export default function Section({ title, total, totalClass = 'text-muted', open, onToggle, children, empty }) {
  return (
    <section className="overflow-hidden rounded-card border border-border bg-card">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className="flex-1 text-lg font-bold">{title}</span>
        <span className={`tabular-nums ${totalClass}`}>{total}</span>
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} className="text-muted" />}
      </button>
      {open && (
        <div className="border-t border-border">
          {empty ? <p className="px-5 py-3 text-sm text-muted">Noch keine Einträge</p> : children}
        </div>
      )}
    </section>
  )
}

export function EntryRow({ label, points, pointsClass = '', onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-t border-border px-5 py-3 text-left first:border-t-0 active:bg-bg">
      <span className="min-w-0 flex-1">{label}</span>
      <span className={`tabular-nums ${pointsClass}`}>{points}</span>
    </button>
  )
}
