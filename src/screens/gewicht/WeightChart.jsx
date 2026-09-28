import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dayMs, formatDateLabel } from '../../lib/dates'
import { weightDomain } from '../../lib/weight'
import { formatWeight } from '../heute/WeightRow'

const PRIMARY = '#2E6F4E'
const tickDate = (ms) => {
  const d = new Date(ms)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.`
}
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

/** Line with dots on a real time axis (spec.md §4.4). `from`/`to` are day IDs for the x range. */
export default function WeightChart({ points, from, to }) {
  const data = points.map((p) => ({ ...p, t: dayMs(p.date) }))
  // 4 gridline intervals on whole kg, so the labels stay short ("98", "100", …).
  const [yMin, yMax] = weightDomain(points)
  const step = Math.max(1, Math.ceil((yMax - yMin) / 4))
  const yTicks = [0, 1, 2, 3, 4].map((i) => yMin + i * step)
  const xFrom = dayMs(from)
  const xTo = Math.max(dayMs(to), xFrom + 86400000) // at least one day wide

  return (
    <div className="h-80 w-full" role="img" aria-label={`Gewichtsverlauf, ${points.length} Messungen`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#E7E5E0" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={[xFrom, xTo]}
            tickFormatter={tickDate}
            tickCount={5}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[yMin, yTicks[4]]}
            ticks={yTicks}
            tickFormatter={tickKg}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={36}
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

