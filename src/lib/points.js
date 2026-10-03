/** Round to the nearest 0.5, ties up, protected against float error (spec.md §1.1). */
export const roundHalf = (x) => Math.round((x + 1e-9) * 2) / 2

/** Reference value = points per 100 g, unrounded (spec.md §1.2). Display only. */
export function refValue(kcal_100, fat_100) {
  return fat_100 / 9 + kcal_100 / 60
}

/** Reference value as shown in lists: rounded to 0.5 for display only (spec.md §1.2). */
export function displayRef(kcal_100, fat_100) {
  return roundHalf(refValue(kcal_100, fat_100))
}

/** Points for a logged food entry: rounded once, after multiplying by quantity (spec.md §1.1). */
export function foodPoints({ qty, unitGrams, kcal_100, fat_100 }) {
  return roundHalf(qty * (unitGrams / 100) * refValue(kcal_100, fat_100))
}

/** Points earned by a sport session (spec.md §1.3). Positive. */
export function sportPoints({ minutes, pointsPer30Min }) {
  return roundHalf((minutes / 30) * pointsPer30Min)
}

/** Free entry with points typed in directly: same 0.5 rounding as every logged entry (spec.md §4.2). */
export function directPoints(value) {
  return roundHalf(value)
}

/** Free entry ("Frei"): kcal and fat are totals of what was eaten; rounded once (spec.md §4.2). */
export function quickPoints({ kcal, fat }) {
  return roundHalf(refValue(kcal, fat))
}

/**
 * Rechner (spec.md §4.7): exact points for kcal/fat, optionally given per 100 g for `grams` grams.
 * Unrounded — display it with one decimal (formatRef).
 */
export function calculatorPoints({ kcal, fat, grams }) {
  const factor = grams > 0 ? grams / 100 : 1
  return refValue(kcal, fat) * factor
}
