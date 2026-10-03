import { useState } from 'react'
import { useData } from '../DataContext'
import { useDocument } from '../hooks/useDocument'
import { useWeights } from '../hooks/useWeights'
import { useToast } from '../components/ToastContext'
import Spinner from '../components/Spinner'
import Chip from '../components/Chip'
import { persist } from '../data'
import { useLogsRange } from '../hooks/useWeekLogs'
import { dayMs, todayId, weekDates } from '../lib/dates'
import { pointsHistory } from '../lib/history'
import { updateLog } from '../lib/log'
import { allRangeStart, pointsInRange, rangeStart, RANGES, weightStats } from '../lib/weight'
import { formatWeight, WeightSheet } from './heute/WeightRow'
import WeightChart from './gewicht/WeightChart'
import PointsChart, { PointsLegend } from './gewicht/PointsChart'

const HALF_DAY = 43200000

const kg = (x) => x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const signedKg = (x) => (x > 0 ? `+${kg(x)}` : x < 0 ? `−${kg(-x)}` : kg(0))

function Stats({ stats }) {
  const cells = [
    ['Start', stats && kg(stats.start)],
    ['Heute', stats && kg(stats.latest)],
    ['Delta', stats && signedKg(stats.delta)],
    ['Max', stats && kg(stats.max)],
    ['Min', stats && kg(stats.min)],
  ]
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-card border border-border bg-card">
      {cells.map(([label, value], i) => (
        <div key={label} className={`px-1 py-2.5 text-center ${i > 0 ? 'border-l border-border' : ''} ${label === 'Heute' ? 'bg-primary-soft' : ''}`}>
          <div className={`text-xs tracking-wide uppercase ${label === 'Heute' ? 'text-primary' : 'text-muted'}`}>{label}</div>
          <div className={`text-[17px] font-bold tabular-nums ${label === 'Heute' ? 'text-primary' : ''}`}>{value ?? '–'}</div>
        </div>
      ))}
    </div>
  )
}

export default function Gewicht() {
  const { settings } = useData()
  const toast = useToast()
  const weights = useWeights()
  const today = todayId()
  const todayLog = useDocument('dailyLogs', today)
  const [range, setRange] = useState('1m')
  const [editing, setEditing] = useState(false)

  const start = rangeStart(range, today)
  // All logs are loaded once, whatever the range, so switching ranges never reloads anything (no spinner, no flicker).
  // The weekly bonus is then computed from whole weeks exactly as on Heute.
  const logs = useLogsRange('2000-01-01', weekDates(today)[6])

  const points = weights ? pointsInRange(weights, range, today) : []
  const stats = weightStats(points)

  // "Alles" starts at the earliest weight or log, but spans at least four weeks (else a single bar slot draws nothing).
  const firstLog = logs && Object.keys(logs).filter((d) => d <= today).sort()[0]
  const from = start ?? allRangeStart([points[0]?.date, firstLog], today)
  // Both charts share one time axis. Bars sit on the day, so pad half a day each side.
  const xDomain = [dayMs(from) - HALF_DAY, dayMs(today) + HALF_DAY]
  const bars = logs ? pointsHistory({ from, to: today, logs, settings, weekly: false }) : []
  const hasBars = bars.some((b) => !b.empty)
  const reference = settings?.dailyAllowance ?? 30

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold">Gewicht</h1>
      <Stats stats={stats} />

      <div className="flex flex-col gap-1 rounded-card border border-border bg-card px-2 pt-3 pb-3">
        {weights === undefined || logs === undefined ? (
          <Spinner inline />
        ) : (
          <>
            <h2 className="px-2 text-sm font-semibold text-muted">Gewicht (kg)</h2>
            {points.length ? (
              <WeightChart points={points} xDomain={xDomain} syncId="gewicht" />
            ) : (
              <p className="flex h-24 items-center justify-center px-6 text-center text-muted">Keine Messungen in diesem Zeitraum</p>
            )}
            <h2 className="mt-3 border-t border-border px-2 pt-3 text-sm font-semibold text-muted">Punkte pro Tag</h2>
            {hasBars ? (
              <>
                <PointsChart bars={bars} xDomain={xDomain} syncId="gewicht" reference={reference} />
                <PointsLegend />
              </>
            ) : (
              <p className="flex h-24 items-center justify-center px-6 text-center text-muted">Keine Einträge in diesem Zeitraum</p>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {RANGES.map((r) => (
          <Chip key={r.id} className="rounded-chip px-0 text-[14px]" active={range === r.id} onClick={() => setRange(r.id)}>
            {r.label}
          </Chip>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-3 rounded-card border border-border bg-card px-5 py-4 text-left active:bg-bg"
      >
        <span className="flex-1 text-lg font-bold">Gewicht eintragen</span>
        <span className="rounded-chip border border-border px-4 py-2 text-lg font-bold text-primary tabular-nums">
          {todayLog?.weight == null ? '–' : formatWeight(todayLog.weight)}
        </span>
      </button>

      {editing && (
        <WeightSheet
          title="Gewicht heute"
          initial={todayLog?.weight ?? null}
          onClose={() => setEditing(false)}
          onSave={(value) => {
            // Always today's log, not the selected date (spec.md §4.4).
            persist(updateLog({ date: today, log: todayLog ?? null, settings, data: { weight: value } }), toast)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}
