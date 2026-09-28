// Shared look of the two Gewicht charts, so their time axes line up exactly.
export const PRIMARY = '#2E6F4E'
export const GRID = '#E7E5E0'
export const AXIS_TICK = { fill: '#6B7280', fontSize: 12 }
export const CHART_MARGIN = { top: 12, right: 20, bottom: 0, left: 0 }
export const Y_AXIS_WIDTH = 36

// Points bar segments (spec.md §4.4): within the day budget / from the weekly bonus / beyond it.
export const POINTS_COLORS = {
  within: PRIMARY,
  bonus: '#6FB08C',
  over: '#C2410C',
}

export const tickDate = (ms) => {
  const d = new Date(ms)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.`
}

const DAY = 86400000

/** Five date ticks at whole days, evenly spread over the shared domain, so both charts label the same dates. */
export function timeTicks([from, to]) {
  const first = Math.ceil(from / DAY) * DAY
  const last = Math.floor(to / DAY) * DAY
  if (last <= first) return [first]
  return [0, 1, 2, 3, 4].map((i) => Math.round((first + ((last - first) * i) / 4) / DAY) * DAY)
}

/** 0 … just above `max` in at most five even, round steps (e.g. 0/10/…/50 or 0/50/…/250). */
export function niceTicks(max) {
  const m = Math.max(max, 1)
  const magnitude = 10 ** Math.floor(Math.log10(m / 5))
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => Math.ceil(m / s) <= 5)
  return Array.from({ length: Math.ceil(m / step) + 1 }, (_, i) => i * step)
}
