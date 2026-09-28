// Recipes (spec.md §4.6): a food doc with type "recipe" whose values are derived live from its ingredients.

export const PORTION = 'Portion'
export const isRecipe = (food) => food?.type === 'recipe'

/**
 * One ingredient with current values: the food's current data if it still exists (and is a plain food),
 * else the ingredient's own snapshot. Adds `grams` = total grams of this ingredient.
 */
export function resolveIngredient(ing, foodsById) {
  const food = foodsById.get(ing.foodId)
  const src = food && !isRecipe(food) ? food : null
  const unitGrams =
    ing.unitLabel === 'g' ? 1 : (src?.units?.find((u) => u.label === ing.unitLabel)?.grams ?? ing.unitGrams)
  return {
    ...ing,
    foodName: src?.name ?? ing.foodName,
    kcal_100: src?.kcal_100 ?? ing.kcal_100,
    fat_100: src?.fat_100 ?? ing.fat_100,
    unitGrams,
    grams: ing.qty * unitGrams,
  }
}

/** Total grams, kcal and fat of a list of ingredients. */
export function recipeTotals(ingredients, foodsById) {
  let grams = 0
  let kcal = 0
  let fat = 0
  for (const ing of ingredients ?? []) {
    const r = resolveIngredient(ing, foodsById)
    grams += r.grams
    kcal += (r.grams * r.kcal_100) / 100
    fat += (r.grams * r.fat_100) / 100
  }
  return { grams, kcal, fat }
}

/** A recipe as a food: derived kcal_100, fat_100 and units "100 g" + "Portion". */
export function resolveRecipe(recipe, foodsById) {
  const { grams, kcal, fat } = recipeTotals(recipe.ingredients, foodsById)
  const servings = recipe.servings || 1
  return {
    ...recipe,
    kcal_100: grams > 0 ? (kcal / grams) * 100 : 0,
    fat_100: grams > 0 ? (fat / grams) * 100 : 0,
    totalGrams: grams,
    units: [
      { label: '100 g', grams: 100 },
      { label: PORTION, grams: grams > 0 ? grams / servings : 100 },
    ],
  }
}

/** Resolve every recipe in the catalog so the rest of the app can treat recipes as plain foods. */
export function resolveFoods(foods) {
  const byId = new Map(foods.map((f) => [f.id, f]))
  return foods.map((f) => (isRecipe(f) ? resolveRecipe(f, byId) : f))
}
