const sum = (items) => (items ?? []).reduce((total, item) => total + item.points, 0)

/**
 * Daily budget and weekly bonus pool, computed live for one week (spec.md §1.4). Never stored.
 * dates: the 7 day IDs Monday..Sunday. logs: { [dateId]: dailyLog }. settings: current settings/config.
 * Returns { weeklyBonus, days: { [dateId]: { foodTotal, sportTotal, dailyAllowance, dayBudget, remaining, poolLeft } } }
 * where poolLeft is what is left of the weekly bonus after that day.
 */
export function computeWeek(dates, logs, settings) {
  // Pool size = weeklyBonus snapshot of the earliest existing log in the week, else current settings (§2).
  const first = dates.map((d) => logs[d]).find(Boolean)
  const weeklyBonus = first?.weeklyBonus ?? settings?.weeklyBonus ?? 20

  let poolLeft = weeklyBonus
  const days = {}
  for (const date of dates) {
    const log = logs[date]
    const foodTotal = sum(log?.entries)
    const sportTotal = sum(log?.sport)
    const dailyAllowance = log?.dailyAllowance ?? settings?.dailyAllowance ?? 30
    const dayBudget = dailyAllowance + sportTotal

    const overflow = Math.max(0, foodTotal - dayBudget)
    const fromPool = Math.min(overflow, Math.max(0, poolLeft))
    poolLeft -= fromPool
    const deficit = overflow - fromPool
    const remaining = overflow > 0 ? 0 - deficit : dayBudget - foodTotal // "0 -" avoids -0

    days[date] = { foodTotal, sportTotal, dailyAllowance, dayBudget, remaining, poolLeft }
  }
  return { weeklyBonus, days }
}
