import { describe, expect, it } from 'vitest'
import { dayRange, pointsHistory } from './history'

const settings = { dailyAllowance: 30, weeklyBonus: 20 }
const day = (food, sport = 0) => ({
  entries: [{ points: food }],
  sport: sport ? [{ points: sport }] : [],
  dailyAllowance: 30,
  weeklyBonus: 20,
})
// Week of Mon 21 – Sun 27 Sept 2026
const logs = {
  '2026-09-21': day(25), // within
  '2026-09-22': day(40), // 10 from bonus
  '2026-09-23': day(45), // 10 from bonus (pool now empty), 5 over
  '2026-09-24': day(31, 3), // budget 33 → within
}

describe('dayRange', () => {
  it('includes both ends and crosses months', () => {
    expect(dayRange('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'])
  })
})

describe('pointsHistory daily (§4.4)', () => {
  const bars = pointsHistory({ from: '2026-09-21', to: '2026-09-25', logs, settings, weekly: false })
  const byDate = Object.fromEntries(bars.map((b) => [b.date, b]))

  it('splits each day into within / bonus / over', () => {
    expect(byDate['2026-09-21']).toMatchObject({ food: 25, budget: 30, within: 25, bonus: 0, over: 0 })
    expect(byDate['2026-09-22']).toMatchObject({ food: 40, within: 30, bonus: 10, over: 0 })
    expect(byDate['2026-09-23']).toMatchObject({ food: 45, within: 30, bonus: 10, over: 5 })
    expect(byDate['2026-09-24']).toMatchObject({ food: 31, budget: 33, within: 31, bonus: 0, over: 0 })
  })
  it('segments always add up to the food total', () => {
    for (const b of bars.filter((b) => !b.empty)) expect(b.within + b.bonus + b.over).toBe(b.food)
  })
  it('marks days without a log as empty', () => {
    expect(byDate['2026-09-25']).toMatchObject({ empty: true })
    expect(bars).toHaveLength(5)
  })
  it('respects the bonus used earlier in the same week, even outside the range', () => {
    const late = pointsHistory({ from: '2026-09-23', to: '2026-09-23', logs, settings, weekly: false })
    expect(late[0]).toMatchObject({ bonus: 10, over: 5 })
  })
})

describe('pointsHistory weekly', () => {
  const weeks = pointsHistory({ from: '2026-09-24', to: '2026-10-06', logs, settings, weekly: true })
  it('sums whole Monday–Sunday weeks', () => {
    expect(weeks[0]).toMatchObject({ date: '2026-09-21', food: 141, within: 116, bonus: 20, over: 5 })
    // 7 × 30 + 3 sport + 20 bonus
    expect(weeks[0].budget).toBe(233)
  })
  it('marks weeks without logs as empty', () => {
    expect(weeks.map((w) => w.date)).toEqual(['2026-09-21', '2026-09-28', '2026-10-05'])
    expect(weeks[1]).toMatchObject({ empty: true })
  })
})
