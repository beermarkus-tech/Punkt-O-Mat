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
