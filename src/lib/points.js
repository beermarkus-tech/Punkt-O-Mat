/** Reference value = points per 100 g, unrounded (spec.md §1.2). Display only. */
export function refValue(kcal_100, fat_100) {
  return fat_100 / 9 + kcal_100 / 60
}
