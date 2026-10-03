import { describe, expect, it } from 'vitest'
import { addMonths } from './dates'
import { allRangeStart, pointsInRange, rangeStart, weightDomain, weightStats } from './weight'

const TODAY = '2026-09-28'
const pts = [
  { date: '2025-11-18', weight: 106 },
  { date: '2026-08-20', weight: 104.5 },
  { date: '2026-09-15', weight: 103 },
  { date: '2026-09-20', weight: 98.5 },
  { date: '2026-09-28', weight: 102 },
  { date: '2026-09-30', weight: 101 }, // future: ignored
]

describe('"Alles" start (§4.4)', () => {
  it('starts at the first entry, however recent', () => {
    expect(allRangeStart(['2026-09-25', '2026-09-27'], '2026-09-28')).toBe('2026-09-25')
    expect(allRangeStart([undefined, '2026-06-02'], '2026-09-28')).toBe('2026-06-02')
  })
  it('shows at least two days (a single day draws no bars)', () => {
    expect(allRangeStart(['2026-09-28'], '2026-09-28')).toBe('2026-09-27')
    expect(allRangeStart([undefined, undefined], '2026-10-03')).toBe('2026-10-02')
  })
})

describe('weight ranges (§4.4)', () => {
  it('counts back from today', () => {
    expect(rangeStart('2w', TODAY)).toBe('2026-09-15')
    expect(rangeStart('1m', TODAY)).toBe('2026-08-28')
    expect(rangeStart('3m', TODAY)).toBe('2026-06-28')
    expect(rangeStart('all', TODAY)).toBe(null)
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
  })
  it('filters and sorts by date', () => {
    expect(pointsInRange(pts, '2w', TODAY).map((p) => p.weight)).toEqual([103, 98.5, 102])
    expect(pointsInRange([...pts].reverse(), 'all', TODAY).map((p) => p.date)[0]).toBe('2025-11-18')
    expect(pointsInRange(pts, 'all', TODAY)).toHaveLength(5)
  })
  it('computes stats over the range', () => {
    expect(weightStats(pointsInRange(pts, 'all', TODAY))).toEqual({ start: 106, latest: 102, delta: -4, max: 106, min: 98.5 })
    expect(weightStats(pointsInRange(pts, '2w', TODAY))).toEqual({ start: 103, latest: 102, delta: -1, max: 103, min: 98.5 })
    expect(weightStats([])).toBe(null)
  })
  it('avoids float noise in the delta', () => {
    expect(weightStats([{ date: 'a', weight: 102.3 }, { date: 'b', weight: 102.1 }]).delta).toBe(-0.2)
  })
  it('pads the y axis by about 1 kg', () => {
    expect(weightDomain([{ weight: 98.5 }, { weight: 106 }])).toEqual([97, 107])
    expect(weightDomain([{ weight: 102 }])).toEqual([101, 103])
  })
})
