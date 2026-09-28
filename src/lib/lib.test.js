import { describe, expect, it } from 'vitest'
import { formatNumber, formatPoints, formatRef, parseNumber, toInput } from './format'
import { letterOf, matches, normalize } from './text'
import { displayRef, refValue, roundHalf } from './points'

describe('refValue (§1.2)', () => {
  it('matches the Brezel example: 3.6 g fat, 238 kcal → 4.367', () => {
    expect(refValue(238, 3.6)).toBeCloseTo(4.3667, 3)
    expect(formatRef(refValue(238, 3.6))).toBe('4,4')
  })
  it('shows one decimal even for whole numbers', () => {
    expect(formatRef(refValue(360, 0))).toBe('6,0')
  })
})

describe('roundHalf (§1.1)', () => {
  it('rounds to the nearest 0.5', () => {
    expect(roundHalf(3.057)).toBe(3)
    expect(roundHalf(6.113)).toBe(6)
    expect(roundHalf(1.528)).toBe(1.5)
    expect(roundHalf(4.367)).toBe(4.5)
    expect(roundHalf(4.74)).toBe(4.5)
    expect(roundHalf(4.76)).toBe(5)
  })
  it('rounds ties up, even with float error', () => {
    expect(roundHalf(0.25)).toBe(0.5)
    expect(roundHalf(0.75)).toBe(1)
    expect(roundHalf(2.7499999999999996)).toBe(3)
  })
  it('matches the Brezel worked example', () => {
    const per100 = refValue(238, 3.6)
    expect(roundHalf(1 * (70 / 100) * per100)).toBe(3)
    expect(roundHalf(2 * (70 / 100) * per100)).toBe(6)
    expect(roundHalf(0.5 * (70 / 100) * per100)).toBe(1.5)
  })
})

describe('displayRef (§1.2)', () => {
  it('shows the reference value rounded to 0.5', () => {
    expect(formatPoints(displayRef(238, 3.6))).toBe('4,5')
    expect(formatPoints(displayRef(360, 0))).toBe('6')
  })
})

describe('formatPoints (§1.5)', () => {
  it('drops a trailing ,0 and uses a comma', () => {
    expect(formatPoints(3)).toBe('3')
    expect(formatPoints(4.5)).toBe('4,5')
    expect(formatPoints(15)).toBe('15')
  })
  it('uses a real minus sign', () => {
    expect(formatPoints(-3)).toBe('−3')
  })
})

describe('parseNumber / toInput', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseNumber('3,6')).toBe(3.6)
    expect(parseNumber(' 238 ')).toBe(238)
    expect(parseNumber('0.5')).toBe(0.5)
  })
  it('rejects empty and garbage input', () => {
    expect(parseNumber('')).toBeNaN()
    expect(parseNumber('abc')).toBeNaN()
    expect(parseNumber('1,2,3')).toBeNaN()
  })
  it('round-trips through the input format', () => {
    expect(toInput(3.6)).toBe('3,6')
    expect(parseNumber(toInput(3.6))).toBe(3.6)
    expect(toInput(null)).toBe('')
  })
  it('formats plain numbers', () => {
    expect(formatNumber(1.5)).toBe('1,5')
    expect(formatNumber(6)).toBe('6')
  })
})

describe('search and grouping (§4.2, §4.3)', () => {
  it('matches without accents or case', () => {
    expect(matches('Brötchen, belegt (Käse)', 'brotchen')).toBe(true)
    expect(matches('Brötchen', 'BRÖT')).toBe(true)
    expect(matches('Apfel', 'birne')).toBe(false)
    expect(normalize('Äpfel')).toBe('apfel')
  })
  it('groups umlauts with their base letter', () => {
    expect(letterOf('Äpfel')).toBe('A')
    expect(letterOf('Öl')).toBe('O')
    expect(letterOf('Überraschung')).toBe('U')
    expect(letterOf('7Up')).toBe('#')
  })
})
