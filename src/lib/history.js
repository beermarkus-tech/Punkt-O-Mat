import { addDays, dayMs, weekDates } from './dates'
import { computeWeek } from './week'

const DAY_MS = 86400000

/** All day IDs from `from` to `to`, inclusive. */
export function dayRange(from, to) {
  const days = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  return days
}

/**
 * Points per day or per week for the Gewicht screen (spec.md §4.4), split by how they were covered:
 * within = inside the day budget, bonus = taken from the weekly bonus, over = beyond it (negative Verbleibend).
 * Uses the same live week computation as Heute (§1.4), so the numbers always agree.
 * Days/weeks without any log are returned with `empty: true` (no bar).
 */
export function pointsHistory({ from, to, logs, settings, weekly }) {
  const weeks = new Map()
  const weekOf = (date) => {
    const dates = weekDates(date)
    if (!weeks.has(dates[0])) weeks.set(dates[0], { dates, ...computeWeek(dates, logs, settings) })
    return weeks.get(dates[0])
  }

  if (!weekly) {
    return dayRange(from, to).map((date) => {
      const t = dayMs(date)
      if (!logs[date]) return { date, t, empty: true }
      const d = weekOf(date).days[date]
      return {
        date,
        t,
        food: d.foodTotal,
        budget: d.dayBudget,
        within: d.foodTotal - d.overflow,
        bonus: d.fromPool,
        over: d.deficit,
      }
    })
  }

  const result = []
  for (let monday = weekDates(from)[0]; monday <= to; monday = addDays(monday, 7)) {
    const week = weekOf(monday)
    const t = dayMs(monday) + 3.5 * DAY_MS // centre of the week
    if (!week.dates.some((d) => logs[d])) {
      result.push({ date: monday, t, empty: true, weekly: true })
      continue
    }
    const sum = (key) => week.dates.reduce((total, d) => total + week.days[d][key], 0)
    const food = sum('foodTotal')
    const overflow = sum('overflow')
    result.push({
      date: monday,
      t,
      weekly: true,
      food,
      budget: sum('dayBudget') + week.weeklyBonus,
      within: food - overflow,
      bonus: sum('fromPool'),
      over: sum('deficit'),
    })
  }
  return result
}
