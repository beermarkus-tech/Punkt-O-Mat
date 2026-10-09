/**
 * What a tapped suggestion changes besides kcal and fat in "Neues Lebensmittel" (spec.md §4.9):
 * the name only if it is still the text that was searched, the Kategorie only if empty,
 * the sizes only if there are none yet. Nothing the user typed is overwritten.
 * `current` = { name, searched, category, units } (units as in the form: [{ label, grams }]).
 */
export function lookupPatch(candidate, current) {
  const patch = {}
  if (current.name.trim() === current.searched.trim()) patch.name = candidate.name
  if (!current.category.trim() && candidate.category) patch.category = candidate.category
  if (current.units.length === 0 && candidate.units?.length) patch.units = candidate.units.map((u) => ({ label: u.label, grams: u.grams }))
  return patch
}
