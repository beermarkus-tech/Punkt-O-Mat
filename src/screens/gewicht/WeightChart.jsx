import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dayMs, formatDateLabel } from '../../lib/dates'
import { weightDomain } from '../../lib/weight'
import { formatWeight } from '../heute/WeightRow'
import { AXIS_TICK, CHART_MARGIN, GRID, PRIMARY, Y_AXIS_WIDTH, tickDate, timeTicks } from './chartStyle'

const tickKg = (kg) => kg.toLocaleString('de-DE', { maximumFractionDigits: 1 })

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-chip border border-border bg-card px-3 py-2 shadow-lg">
      <div className="text-base font-bold tabular-nums">{formatWeight(p.weight)}</div>
      <div className="text-xs text-muted">{formatDateLabel(p.date)}</div>
    </div>
  )
}

/** Weight line with dots on a real time axis (spec.md §4.4). xDomain = [ms, ms] shared with the points chart. */
export default function WeightChart({ points, xDomain, syncId }) {
  const data = points.map((p) => ({ ...p, t: dayMs(p.date) }))
  // 4 gridline intervals on whole kg, so the labels stay short ("98", "100", …).
  const [yMin, yMax] = weightDomain(points)
  const step = Math.max(1, Math.ceil((yMax - yMin) / 4))
  const yTicks = [0, 1, 2, 3, 4].map((i) => yMin + i * step)

  return (
    <div className="h-60 w-full" role="img" aria-label={`Gewichtsverlauf, ${points.length} Messungen`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN} syncId={syncId} syncMethod="value">
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
            domain={[yMin, yTicks[4]]}
            ticks={yTicks}
            tickFormatter={tickKg}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={Y_AXIS_WIDTH}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#6B7280', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Line
            type="linear"
            dataKey="weight"
            stroke={PRIMARY}
            strokeWidth={2.5}
            dot={{ r: 4, fill: PRIMARY, stroke: '#FFFFFF', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: PRIMARY, stroke: '#FFFFFF', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
