import { describe, expect, it } from 'vitest'
import { foodPoints, sportPoints } from './points'
import { dateId, formatDateLabel, suggestSection } from './dates'
import { entryLabel, sportLabel, unitChipLabel } from './entries'

const brezel = { kcal_100: 238, fat_100: 3.6 }

describe('foodPoints (§1.1)', () => {
  it('matches the Brezel worked example', () => {
    expect(foodPoints({ ...brezel, qty: 1, unitGrams: 70 })).toBe(3)
    expect(foodPoints({ ...brezel, qty: 2, unitGrams: 70 })).toBe(6)
    expect(foodPoints({ ...brezel, qty: 0.5, unitGrams: 70 })).toBe(1.5)
  })
  it('rounds once at the end, not per unit', () => {
    // 3 × 70 g: per unit 3.057 → rounding first would give 3 × 3 = 9; correct is 9.17 → 9
    // 1.5 × 70 g = 4.585 → 4.5 (per-unit rounding would give 4.5 too) — use a case that differs:
    // 5 × 70 g = 15.28 → 15.5; per-unit rounding would give 5 × 3 = 15
    expect(foodPoints({ ...brezel, qty: 5, unitGrams: 70 })).toBe(15.5)
  })
  it('works with free grams (unitGrams 1, qty = grams)', () => {
    expect(foodPoints({ ...brezel, qty: 35, unitGrams: 1 })).toBe(1.5) // 1.528
    expect(foodPoints({ ...brezel, qty: 100, unitGrams: 1 })).toBe(4.5) // 4.367
  })
  it('gives 0 for zero-calorie food', () => {
    expect(foodPoints({ kcal_100: 0, fat_100: 0, qty: 3, unitGrams: 250 })).toBe(0)
  })
})

describe('sportPoints (§1.3)', () => {
  it('scales with minutes and rounds to 0.5', () => {
    expect(sportPoints({ minutes: 30, pointsPer30Min: 3 })).toBe(3)
    expect(sportPoints({ minutes: 45, pointsPer30Min: 3 })).toBe(4.5)
    expect(sportPoints({ minutes: 20, pointsPer30Min: 3 })).toBe(2)
    expect(sportPoints({ minutes: 25, pointsPer30Min: 3 })).toBe(2.5)
    expect(sportPoints({ minutes: 10, pointsPer30Min: 4.5 })).toBe(1.5)
  })
})

describe('dates (§2, §1.5)', () => {
  it('uses the Paris date, not UTC, around midnight', () => {
    // 23:30 UTC on 27 Sept = 01:30 on 28 Sept in Paris (summer time)
    expect(dateId(new Date('2026-09-27T23:30:00Z'))).toBe('2026-09-28')
    // 22:30 UTC on 27 Sept = 00:30 on 28 Sept in Paris
    expect(dateId(new Date('2026-09-27T22:30:00Z'))).toBe('2026-09-28')
    expect(dateId(new Date('2026-09-27T21:30:00Z'))).toBe('2026-09-27')
    // winter time (UTC+1)
    expect(dateId(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })
  it('formats German date labels', () => {
    expect(formatDateLabel('2026-09-27')).toBe('So, 27. Sept.')
    expect(formatDateLabel('2026-03-02')).toBe('Mo, 2. März')
  })
})

describe('suggestSection (§4.2)', () => {
  // Paris summer time = UTC+2
  const at = (hhmm) => new Date(`2026-09-28T${hhmm}:00+02:00`)
  it('follows the time-of-day ranges', () => {
    expect(suggestSection(at('03:59'))).toBe('zwischendurch')
    expect(suggestSection(at('04:00'))).toBe('morgens')
    expect(suggestSection(at('10:59'))).toBe('morgens')
    expect(suggestSection(at('11:00'))).toBe('mittags')
    expect(suggestSection(at('14:59'))).toBe('mittags')
    expect(suggestSection(at('15:00'))).toBe('zwischendurch')
    expect(suggestSection(at('17:29'))).toBe('zwischendurch')
    expect(suggestSection(at('17:30'))).toBe('abends')
    expect(suggestSection(at('21:59'))).toBe('abends')
    expect(suggestSection(at('22:00'))).toBe('zwischendurch')
    expect(suggestSection(at('00:00'))).toBe('zwischendurch')
  })
})

describe('labels (§4.1, §4.2)', () => {
  it('formats entry rows', () => {
    expect(entryLabel({ qty: 1, unitLabel: 'Klein', foodName: 'Brezel' })).toBe('1 Klein Brezel')
    expect(entryLabel({ qty: 1.5, unitLabel: 'Klein', foodName: 'Brezel' })).toBe('1,5 Klein Brezel')
    expect(entryLabel({ qty: 35, unitLabel: 'g', foodName: 'Brezel' })).toBe('35 g Brezel')
    expect(entryLabel({ qty: 2, unitLabel: '100 g', foodName: 'Brezel' })).toBe('2 × 100 g Brezel')
    expect(sportLabel({ minutes: 45, sportName: 'Radfahren' })).toBe('45 Min Radfahren')
  })
  it('formats unit chips', () => {
    expect(unitChipLabel('100 g')).toBe('100 g')
    expect(unitChipLabel('Klein')).toBe('1 Klein')
  })
})
