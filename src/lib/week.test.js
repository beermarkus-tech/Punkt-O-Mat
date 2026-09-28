import { describe, expect, it } from 'vitest'
import { computeWeek } from './week'
import { addDays, relativeDayLabel, weekDates } from './dates'

const WEEK = weekDates('2026-09-23') // Mon 21 .. Sun 27 Sept 2026
const [MON, TUE, WED, THU, , , SUN] = WEEK
const settings = { dailyAllowance: 30, weeklyBonus: 20 }
const day = (food, sport = [], extra = {}) => ({
  entries: food.map((points) => ({ points })),
  sport: sport.map((points) => ({ points })),
  dailyAllowance: 30,
  weeklyBonus: 20,
  ...extra,
})

describe('weekDates / labels', () => {
  it('runs Monday to Sunday', () => {
    expect(WEEK).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27'])
    expect(weekDates('2026-09-21')[0]).toBe('2026-09-21')
    expect(weekDates('2026-09-27')[0]).toBe('2026-09-21')
  })
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(weekDates('2027-01-01')[0]).toBe('2026-12-28')
  })
  it('labels days relative to today', () => {
    expect(relativeDayLabel('2026-09-28', '2026-09-28')).toBe('Heute')
    expect(relativeDayLabel('2026-09-27', '2026-09-28')).toBe('Gestern')
    expect(relativeDayLabel('2026-09-29', '2026-09-28')).toBe('Morgen')
    expect(relativeDayLabel('2026-09-24', '2026-09-28')).toBe('Donnerstag')
  })
})

describe('computeWeek (§1.4)', () => {
  it('under budget: Verbleibend = budget − food, pool untouched', () => {
    const { weeklyBonus, days } = computeWeek(WEEK, { [MON]: day([10, 11]) }, settings)
    expect(weeklyBonus).toBe(20)
    expect(days[MON]).toMatchObject({ foodTotal: 21, dayBudget: 30, remaining: 9, poolLeft: 20 })
  })

  it('sport raises the day budget', () => {
    const { days } = computeWeek(WEEK, { [MON]: day([31], [3]) }, settings)
    expect(days[MON]).toMatchObject({ dayBudget: 33, sportTotal: 3, remaining: 2, poolLeft: 20 })
  })

  it('overflow comes out of the pool; Verbleibend stays 0', () => {
    const { days } = computeWeek(WEEK, { [MON]: day([35]), [TUE]: day([34]) }, settings)
    expect(days[MON]).toMatchObject({ remaining: 0, poolLeft: 15 })
    expect(days[TUE]).toMatchObject({ remaining: 0, poolLeft: 11 })
  })

  it('once the pool is empty the excess shows as negative Verbleibend on that day only', () => {
    const logs = { [MON]: day([45]), [TUE]: day([38]), [WED]: day([25]) }
    const { days } = computeWeek(WEEK, logs, settings)
    expect(days[MON]).toMatchObject({ remaining: 0, poolLeft: 5 }) // 15 from pool
    expect(days[TUE]).toMatchObject({ remaining: -3, poolLeft: 0 }) // 8 over: 5 from pool, 3 uncovered
    expect(days[WED]).toMatchObject({ remaining: 5, poolLeft: 0 }) // under budget again, pool stays empty
  })

  it('unused daily points do not flow into the pool', () => {
    const { days } = computeWeek(WEEK, { [MON]: day([5]), [TUE]: day([40]) }, settings)
    expect(days[MON].poolLeft).toBe(20)
    expect(days[TUE]).toMatchObject({ remaining: 0, poolLeft: 10 })
  })

  it('editing an earlier day re-flows the rest of the week', () => {
    const before = computeWeek(WEEK, { [MON]: day([30]), [TUE]: day([45]), [WED]: day([40]) }, settings)
    expect(before.days[TUE].poolLeft).toBe(5)
    expect(before.days[WED]).toMatchObject({ remaining: -5, poolLeft: 0 })

    // Monday goes 10 over after an edit: less pool left for Tuesday and Wednesday.
    const after = computeWeek(WEEK, { [MON]: day([40]), [TUE]: day([45]), [WED]: day([40]) }, settings)
    expect(after.days[MON]).toMatchObject({ remaining: 0, poolLeft: 10 })
    expect(after.days[TUE]).toMatchObject({ remaining: -5, poolLeft: 0 })
    expect(after.days[WED]).toMatchObject({ remaining: -10, poolLeft: 0 })
  })

  it('days without a log use current settings and count as empty', () => {
    const { days } = computeWeek(WEEK, {}, { dailyAllowance: 28, weeklyBonus: 15 })
    expect(days[THU]).toMatchObject({ foodTotal: 0, dayBudget: 28, remaining: 28, poolLeft: 15 })
    expect(days[SUN].poolLeft).toBe(15)
  })

  it('uses each day’s own allowance snapshot and the earliest log’s weekly bonus', () => {
    const logs = {
      [TUE]: day([33], [], { dailyAllowance: 25, weeklyBonus: 10 }),
      [WED]: day([33], [], { dailyAllowance: 30, weeklyBonus: 20 }),
    }
    const { weeklyBonus, days } = computeWeek(WEEK, logs, settings)
    expect(weeklyBonus).toBe(10)
    expect(days[MON].dayBudget).toBe(30) // no log → current settings
    expect(days[TUE]).toMatchObject({ dayBudget: 25, remaining: 0, poolLeft: 2 }) // 8 over
    expect(days[WED]).toMatchObject({ dayBudget: 30, remaining: -1, poolLeft: 0 }) // 3 over, 2 from pool
  })

  it('handles half points exactly', () => {
    const { days } = computeWeek(WEEK, { [MON]: day([10.5, 20, 0.5]) }, settings)
    expect(days[MON]).toMatchObject({ foodTotal: 31, remaining: 0, poolLeft: 19 })
  })
})
