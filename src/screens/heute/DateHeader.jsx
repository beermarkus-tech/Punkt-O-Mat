import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, formatDateLabel, relativeDayLabel, todayId } from '../../lib/dates'

/** ◀ date ▶ with a native date picker on the label and a "Heute" chip (spec.md §4.1). */
export default function DateHeader({ date, onChange }) {
  const today = todayId()
  const arrow = 'flex size-12 items-center justify-center rounded-chip bg-card shadow-sm active:bg-border'

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(addDays(date, -1))} aria-label="Vorheriger Tag" className={arrow}>
        <ChevronLeft size={24} />
      </button>
      <div className="flex flex-1 flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-muted uppercase">{relativeDayLabel(date, today)}</span>
          {date !== today && (
            <button
              type="button"
              onClick={() => onChange(today)}
              className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white active:opacity-80"
            >
              Heute
            </button>
          )}
        </div>
        <div className="relative">
          <div className="px-2 text-lg font-bold">{formatDateLabel(date)}</div>
          {/* Invisible native date input over the date: tapping it opens the phone's date picker ("Zu Datum"). */}
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            aria-label="Zu Datum"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>
      <button type="button" onClick={() => onChange(addDays(date, 1))} aria-label="Nächster Tag" className={arrow}>
        <ChevronRight size={24} />
      </button>
    </div>
  )
}
