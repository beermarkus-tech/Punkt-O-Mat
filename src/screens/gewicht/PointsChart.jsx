import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addDays, formatDateLabel } from '../../lib/dates'
import { formatPoints } from '../../lib/format'
import { AXIS_TICK, CHART_MARGIN, GRID, POINTS_COLORS, Y_AXIS_WIDTH, tickDate, timeTicks, niceTicks } from './chartStyle'

const SEGMENTS = [
  { key: 'within', label: 'Im Tagesbudget' },
  { key: 'bonus', label: 'Aus Wochenbonus' },
  { key: 'over', label: 'Darüber' },
]

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const b = payload[0].payload
  const when = b.weekly ? `Woche ${formatDateLabel(b.date)} – ${formatDateLabel(addDays(b.date, 6))}` : formatDateLabel(b.date)
  return (
    <div className="rounded-chip border border-border bg-card px-3 py-2 shadow-lg">
      {b.empty ? (
        <div className="text-sm text-muted">Keine Einträge</div>
      ) : (
        <>
          <div className="text-base font-bold tabular-nums">
            {formatPoints(b.food)} Pkt. <span className="text-sm font-normal text-muted">von {formatPoints(b.budget)}</span>
          </div>
          {SEGMENTS.filter((s) => b[s.key] > 0 && s.key !== 'within').map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-0.5 w-3" style={{ background: POINTS_COLORS[s.key] }} />
              {s.label}: {formatPoints(b[s.key])}
            </div>
          ))}
        </>
      )}
      <div className="text-xs text-muted">{when}</div>
    </div>
  )
}

export function PointsLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-muted">
      {SEGMENTS.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: POINTS_COLORS[s.key] }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

/**
 * Stacked points bars per day or per week, on the same time axis as the weight chart (spec.md §4.4).
 * `reference` = the dashed budget line (daily allowance, or 7 × allowance + weekly bonus for weeks).
 */
export default function PointsChart({ bars, xDomain, syncId, reference }) {
  const max = Math.max(reference ?? 0, ...bars.filter((b) => !b.empty).map((b) => b.food))
  const yTicks = niceTicks(max * 1.05)

  return (
    <div className="h-44 w-full" role="img" aria-label="Punkte im Zeitverlauf">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={CHART_MARGIN} syncId={syncId} syncMethod="value" barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={xDomain}
            ticks={timeTicks(xDomain)}
            tickFormatter={tickDate}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[0, yTicks[yTicks.length - 1]]}
            ticks={yTicks}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={Y_AXIS_WIDTH}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(107,114,128,0.08)' }} />
          {reference != null && (
            <ReferenceLine y={reference} stroke="#6B7280" strokeDasharray="4 3" strokeWidth={1} ifOverflow="extendDomain" />
          )}
          {SEGMENTS.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="points"
              fill={POINTS_COLORS[s.key]}
              isAnimationActive={false}
              radius={i === SEGMENTS.length - 1 ? [3, 3, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
