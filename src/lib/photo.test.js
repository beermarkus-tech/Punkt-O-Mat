import { describe, expect, it } from 'vitest'
import { buildEntries, estimateTotals, friendlyError, itemFromFood, itemFromResult, itemPoints, knownFoodsPayload, totalPoints } from './photo'

const brezel = { id: 'b1', name: 'Brezel', kcal_100: 300, fat_100: 3 }
const byId = new Map([[brezel.id, brezel]])
const result = (over = {}) => ({ name: 'Spaghetti', matchedFoodId: null, grams: 250, kcalPer100: 150, fatPer100: 2, confidence: 'mittel', optional: false, note: '', ...over })

describe('review rows', () => {
  it('uses the Datenbank values for a matched item, Claude\'s for an unmatched one', () => {
    const m = itemFromResult(result({ matchedFoodId: 'b1', kcalPer100: 1, fatPer100: 1 }), byId)
    expect(m).toMatchObject({ foodId: 'b1', name: 'Brezel', kcal100: 300, fat100: 3 })
    const u = itemFromResult(result(), byId)
    expect(u).toMatchObject({ foodId: null, name: 'Spaghetti', kcal100: 150, fat100: 2 })
  })
  it('treats an id that is no longer in the Datenbank as unmatched', () => {
    expect(itemFromResult(result({ matchedFoodId: 'gone' }), byId).foodId).toBeNull()
  })
  it('starts optional items (hidden fat) unchecked', () => {
    expect(itemFromResult(result({ optional: true }), byId).checked).toBe(false)
    expect(itemFromResult(result(), byId).checked).toBe(true)
  })
  it('sends only id and name of the foods', () => {
    expect(knownFoodsPayload([{ ...brezel, units: [] }])).toEqual([{ id: 'b1', name: 'Brezel' }])
    expect(knownFoodsPayload(null)).toEqual([])
  })
})

describe('points', () => {
  it('matched: same formula as a food in grams, rounded once', () => {
    // 35 g × (3/9 + 300/60) / 100 = 1.8666… → 2
    expect(itemPoints(itemFromFood(brezel, 35))).toBe(2)
  })
  it('unmatched: same formula as a free entry on the totals', () => {
    // 250 g at 150 kcal / 2 g fat → 375 kcal, 5 g fat → 5/9 + 375/60 = 6.8056 → 7
    const i = itemFromResult(result(), byId)
    expect(estimateTotals(i)).toEqual({ kcal: 375, fat: 5 })
    expect(itemPoints(i)).toBe(7)
  })
  it('totals only the checked rows', () => {
    const a = itemFromFood(brezel, 100)
    const b = { ...itemFromFood(brezel, 100), checked: false }
    expect(totalPoints([a, b])).toBe(itemPoints(a))
  })
})

describe('buildEntries', () => {
  it('matched rows become ordinary gram entries, unmatched ones free entries, all marked as photo', () => {
    const rows = [itemFromFood(brezel, 35), itemFromResult(result(), byId), { ...itemFromFood(brezel, 50), checked: false }]
    const [m, u, ...rest] = buildEntries(rows, 'mittags')
    expect(rest).toEqual([])
    expect(m).toMatchObject({ section: 'mittags', foodId: 'b1', foodName: 'Brezel', unitLabel: 'g', unitGrams: 1, qty: 35, points: 2, source: 'photo' })
    expect(u).toMatchObject({ type: 'quick', section: 'mittags', foodName: 'Spaghetti', kcal: 375, fat: 5, points: 7, source: 'photo' })
  })
  it('skips rows with zero grams', () => {
    expect(buildEntries([itemFromFood(brezel, 0)], 'abends')).toEqual([])
  })
})

describe('friendlyError', () => {
  it('shows the server\'s German message for known cases', () => {
    expect(friendlyError({ code: 'functions/resource-exhausted', message: 'Tageslimit von 40 Analysen erreicht.' })).toBe('Tageslimit von 40 Analysen erreicht.')
  })
  it('hides raw technical messages', () => {
    expect(friendlyError({ code: 'functions/internal', message: 'internal' })).toMatch(/fehlgeschlagen/)
    expect(friendlyError({ code: 'functions/unavailable', message: 'unavailable' })).toMatch(/Verbindung/)
    expect(friendlyError(new Error('boom'))).toMatch(/fehlgeschlagen/)
  })
})
