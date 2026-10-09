import { describe, expect, it } from 'vitest'
import { lookupPatch } from './foodLookup'

const cand = { name: 'Weißwein, trocken', category: 'Getränke', units: [{ label: 'Glas', grams: 150 }] }

describe('lookupPatch', () => {
  it('fills name, category and sizes into an untouched form', () => {
    expect(lookupPatch(cand, { name: 'Wein', searched: 'Wein', category: '', units: [] })).toEqual({
      name: 'Weißwein, trocken',
      category: 'Getränke',
      units: [{ label: 'Glas', grams: 150 }],
    })
  })
  it('keeps what the user changed since the search', () => {
    expect(lookupPatch(cand, { name: 'Mein Wein', searched: 'Wein', category: 'Alkohol', units: [{ label: 'Stück', grams: 12 }] })).toEqual({})
  })
  it('does nothing about category or sizes the suggestion does not have', () => {
    expect(lookupPatch({ name: 'X', category: null, units: [] }, { name: 'x', searched: 'x', category: '', units: [] })).toEqual({ name: 'X' })
  })
})
