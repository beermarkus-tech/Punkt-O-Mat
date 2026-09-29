import { describe, expect, it } from 'vitest'
import { calculatorPoints, quickPoints } from './points'
import { formatRef } from './format'
import { entryLabel } from './entries'

describe('free entry points (§4.2)', () => {
  it('uses kcal and fat as totals, rounded once to 0.5', () => {
    expect(quickPoints({ kcal: 850, fat: 30 })).toBe(17.5) // 3.33 + 14.17 = 17.5
    expect(quickPoints({ kcal: 238, fat: 3.6 })).toBe(4.5) // 4.367
    expect(quickPoints({ kcal: 0, fat: 0 })).toBe(0)
  })
  it('labels a free entry with its title', () => {
    expect(entryLabel({ type: 'quick', foodName: 'Pizza beim Italiener' })).toBe('Pizza beim Italiener')
  })
})

describe('Rechner (§4.7)', () => {
  it('gives exact points, shown with one decimal, rounded like everywhere else', () => {
    expect(formatRef(calculatorPoints({ kcal: 238, fat: 3.6 }))).toBe('4,4') // 4.367
    expect(formatRef(calculatorPoints({ kcal: 240, fat: 3.15 }))).toBe('4,4') // 4.35 → 4,4 (rounds, not cut)
  })
  it('scales per-100 g values to the grams given', () => {
    expect(calculatorPoints({ kcal: 238, fat: 3.6, grams: 70 })).toBeCloseTo(3.057, 3)
    expect(calculatorPoints({ kcal: 238, fat: 3.6, grams: 0 })).toBeCloseTo(4.367, 3) // empty/0 → as entered
  })
})
