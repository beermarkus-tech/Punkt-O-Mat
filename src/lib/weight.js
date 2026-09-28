import { addDays, addMonths } from './dates'

export const RANGES = [
  { id: '2w', label: '2 Wochen' },
  { id: '1m', label: '1 Monat' },
  { id: '3m', label: '3 Monate' },
  { id: 'all', label: 'Alles' },
]

/** First day of a range counted back from today (spec.md §4.4); null = no limit. */
export function rangeStart(range, today) {
  if (range === '2w') return addDays(today, -13) // 14 days including today
  if (range === '1m') return addMonths(today, -1)
  if (range === '3m') return addMonths(today, -3)
  return null
}

/** Measurements [{ date, weight }] (any order) inside the range, sorted by date. */
export function pointsInRange(points, range, today) {
  const start = rangeStart(range, today)
  return points
    .filter((p) => (!start || p.date >= start) && p.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

/** START / HEUTE / DELTA / MAX / MIN over sorted points; null when empty. */
export function weightStats(sorted) {
  if (!sorted.length) return null
  const weights = sorted.map((p) => p.weight)
  const start = weights[0]
  const latest = weights[weights.length - 1]
  return {
    start,
    latest,
    delta: Math.round((latest - start) * 10) / 10,
    max: Math.max(...weights),
    min: Math.min(...weights),
  }
}

/** y-axis domain with ~1 kg padding, on whole kg. */
export function weightDomain(sorted) {
  const weights = sorted.map((p) => p.weight)
  return [Math.floor(Math.min(...weights) - 1), Math.ceil(Math.max(...weights) + 1)]
}
