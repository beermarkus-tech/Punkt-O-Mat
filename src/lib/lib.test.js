import { describe, expect, it } from 'vitest'
import { formatNumber, formatPoints, formatRef, parseNumber, toInput } from './format'
import { letterOf, matches, normalize } from './text'
import { refValue } from './points'

describe('refValue (§1.2)', () => {
  it('matches the Brezel example: 3.6 g fat, 238 kcal → 4.367', () => {
    expect(refValue(238, 3.6)).toBeCloseTo(4.3667, 3)
    expect(formatRef(refValue(238, 3.6))).toBe('4,4')
  })
  it('shows one decimal even for whole numbers', () => {
    expect(formatRef(refValue(360, 0))).toBe('6,0')
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
