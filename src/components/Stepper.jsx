import { Minus, Plus } from 'lucide-react'
import { formatNumber } from '../lib/format'

export default function Stepper({ value, onChange, step, min, suffix = '' }) {
  const btn = 'flex size-11 items-center justify-center rounded-chip border border-border bg-bg active:bg-border disabled:opacity-30'
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - step))} disabled={value - step < min} aria-label="Weniger">
        <Minus size={20} />
      </button>
      <span className="min-w-14 text-center text-xl font-semibold tabular-nums">
        {formatNumber(value)}
        {suffix}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + step)} aria-label="Mehr">
        <Plus size={20} />
      </button>
    </div>
  )
}
