import { Minus } from 'lucide-react'
import { formatNumber } from '../../lib/format'
import { trackerColor, trackerIcon } from '../../trackerStyle'

/** Tap = +step, "−" = −step (min 0). Segmented bar when target/step ≤ 10 (spec.md §4.1). */
export default function TrackerCard({ tracker, value, onChange }) {
  const Icon = trackerIcon(tracker.icon)
  const color = trackerColor(tracker.color)
  const step = tracker.step || 1
  const segments = tracker.dailyTarget / step
  const segmented = segments <= 10

  return (
    <div className="relative rounded-card border border-border bg-card">
      <button
        type="button"
        onClick={() => onChange(value + step)}
        aria-label={`${tracker.name} +${formatNumber(step)}`}
        className="flex h-full w-full flex-col justify-between gap-2.5 rounded-card px-3.5 pt-3.5 pb-3 text-left active:bg-bg"
      >
        <span className="flex min-w-0 items-start gap-2">
          <Icon size={18} style={{ color }} className="shrink-0" />
          <span className="min-w-0 text-[15px] leading-tight font-bold break-words">{tracker.name}</span>
        </span>
        {segmented ? (
          <span className="flex gap-1">
            {Array.from({ length: Math.ceil(segments) }, (_, i) => (
              <span
                key={i}
                className="h-2.5 flex-1 rounded-full"
                style={{ background: (i + 1) * step <= value ? color : '#E7E5E0' }}
              />
            ))}
          </span>
        ) : (
          <span className="h-2.5 overflow-hidden rounded-full bg-border">
            <span className="block h-full rounded-full" style={{ background: color, width: `${Math.min(100, (value / tracker.dailyTarget) * 100)}%` }} />
          </span>
        )}
        <span className="pr-9 text-sm text-muted tabular-nums">
          {formatNumber(value)} / {formatNumber(tracker.dailyTarget)} {tracker.unit}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - step))}
        disabled={value <= 0}
        aria-label={`${tracker.name} −${formatNumber(step)}`}
        className="absolute right-2 bottom-1.5 flex size-8 items-center justify-center rounded-full text-muted active:bg-border disabled:opacity-30"
      >
        <Minus size={18} />
      </button>
    </div>
  )
}
