import { formatPoints } from '../../lib/format'

/** Green card: Verbleibend, Maximum, Verbraucht, Wochenbonus (spec.md §4.1). */
export default function SummaryCard({ day, weeklyBonus }) {
  const negative = day.remaining < 0
  return (
    <section className="rounded-card bg-primary px-6 pt-5 pb-4 text-white">
      <div className="flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm tracking-wide text-white/80 uppercase">Verbleibend</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl leading-none font-extrabold tabular-nums ${negative ? 'text-[#FDBA74]' : ''}`}>
              {formatPoints(day.remaining)}
            </span>
            <span className="text-2xl text-white/80">Pkt.</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-white/80">Maximum</div>
          <div className="text-2xl font-bold tabular-nums">{formatPoints(day.dayBudget)}</div>
          {day.sportTotal > 0 && (
            <div className="text-xs text-white/70">
              {formatPoints(day.dailyAllowance)} + {formatPoints(day.sportTotal)} Sport
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-white/80">Verbraucht</div>
          <div className="text-2xl font-bold tabular-nums">{formatPoints(day.foodTotal)}</div>
          {day.sportTotal > 0 && <div className="text-xs text-transparent">.</div>}
        </div>
      </div>
      <div className="mt-4 flex justify-between border-t border-white/25 pt-3">
        <span className="text-white/90">Wochenbonus</span>
        <span className="font-bold tabular-nums">
          {formatPoints(day.poolLeft)} / {formatPoints(weeklyBonus)} übrig
        </span>
      </div>
    </section>
  )
}
