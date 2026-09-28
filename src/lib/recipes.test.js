import { describe, expect, it } from 'vitest'
import { foodPoints, refValue, roundHalf } from './points'
import { PORTION, recipeTotals, resolveFoods, resolveRecipe } from './recipes'

const u = (label, grams) => ({ label, grams })
const joghurt = { id: 'j', name: 'Griechischer Joghurt', kcal_100: 120, fat_100: 10, units: [u('100 g', 100), u('Becher', 150)] }
const sirup = { id: 's', name: 'Agavensirup', kcal_100: 310, fat_100: 0, units: [u('100 g', 100), u('TL', 7)] }
const flakes = { id: 'c', name: 'Cornflakes', kcal_100: 370, fat_100: 1, units: [u('100 g', 100)] }
const ing = (food, unitLabel, unitGrams, qty) => ({
  foodId: food.id, foodName: food.name, kcal_100: food.kcal_100, fat_100: food.fat_100, unitLabel, unitGrams, qty,
})
const muesli = {
  id: 'm', type: 'recipe', name: 'Frühstücksmüsli', category: 'Speisen', servings: 1,
  ingredients: [ing(joghurt, '100 g', 100, 1), ing(sirup, 'g', 1, 10), ing(flakes, 'g', 1, 40)],
}
const byId = (...foods) => new Map(foods.map((f) => [f.id, f]))
const portionPoints = (r) => foodPoints({ qty: 1, unitGrams: r.units[1].grams, kcal_100: r.kcal_100, fat_100: r.fat_100 })

// Exact raw points of the Müsli: 3.1111 + 0.5167 + 2.5111 = 6.1389
const RAW = refValue(120, 10) + 0.1 * refValue(310, 0) + 0.4 * refValue(370, 1)

describe('recipes (§4.6)', () => {
  it('sums ingredient grams, kcal and fat', () => {
    const t = recipeTotals(muesli.ingredients, byId(joghurt, sirup, flakes))
    expect(t.grams).toBe(150)
    expect(t.kcal).toBeCloseTo(120 + 31 + 148, 9)
    expect(t.fat).toBeCloseTo(10 + 0 + 0.4, 9)
  })

  it('1 Portion = exact total, rounded once', () => {
    const r = resolveRecipe(muesli, byId(joghurt, sirup, flakes))
    expect(r.units).toEqual([u('100 g', 100), u(PORTION, 150)])
    expect(portionPoints(r)).toBe(roundHalf(RAW)) // 6
    expect(portionPoints(r)).toBe(6)
  })

  it('rounds once even when per-ingredient rounding would differ', () => {
    // three ingredients of 0.3 raw points each: rounded separately 0.5 × 3 = 1.5, correct is 0.9 → 1
    const tiny = { id: 't', name: 'Tiny', kcal_100: 18, fat_100: 0, units: [u('100 g', 100)] } // 0.3 per 100 g
    const r = resolveRecipe({ type: 'recipe', servings: 1, ingredients: [ing(tiny, '100 g', 100, 3)] }, byId(tiny))
    expect(portionPoints(r)).toBe(1)
  })

  it('divides by servings', () => {
    const r = resolveRecipe({ ...muesli, servings: 2 }, byId(joghurt, sirup, flakes))
    expect(r.units[1]).toEqual(u(PORTION, 75))
    expect(portionPoints(r)).toBe(roundHalf(RAW / 2)) // 3.07 → 3
  })

  it('uses current ingredient data (live updates)', () => {
    const fatter = { ...joghurt, fat_100: 19 } // +1 point per 100 g
    const r = resolveRecipe(muesli, byId(fatter, sirup, flakes))
    expect(portionPoints(r)).toBe(roundHalf(RAW + 1)) // 7.14 → 7
  })

  it('uses the unit’s current grams, or the stored grams if the unit is gone', () => {
    const withBecher = { ...muesli, ingredients: [ing(joghurt, 'Becher', 150, 1)] }
    const bigger = { ...joghurt, units: [u('100 g', 100), u('Becher', 200)] }
    expect(resolveRecipe(withBecher, byId(bigger)).totalGrams).toBe(200)
    const noBecher = { ...joghurt, units: [u('100 g', 100)] }
    expect(resolveRecipe(withBecher, byId(noBecher)).totalGrams).toBe(150)
  })

  it('falls back to the snapshot when an ingredient food is deleted', () => {
    const r = resolveRecipe(muesli, byId(sirup, flakes)) // joghurt deleted
    expect(portionPoints(r)).toBe(6)
  })

  it('handles an empty recipe without dividing by zero', () => {
    const r = resolveRecipe({ type: 'recipe', servings: 1, ingredients: [] }, byId())
    expect(r.kcal_100).toBe(0)
    expect(portionPoints(r)).toBe(0)
  })

  it('resolveFoods leaves plain foods untouched and resolves recipes', () => {
    const all = resolveFoods([joghurt, sirup, flakes, muesli])
    expect(all[0]).toBe(joghurt)
    expect(all[3].units[1].label).toBe(PORTION)
    expect(all[3].kcal_100).toBeCloseTo((299 / 150) * 100, 9)
  })
})
