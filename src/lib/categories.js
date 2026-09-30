// Food categories are plain text on each food (spec.md §2); renaming rewrites every food that uses one (§4.3).

/** [{ name, count }] of all categories in use, alphabetical (German). */
export function categoryCounts(foods) {
  const counts = new Map()
  for (const f of foods ?? []) if (f.category) counts.set(f.category, (counts.get(f.category) ?? 0) + 1)
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

/**
 * Plan a rename of category `from` to `to` (trimmed).
 * Returns { name, ids, mergeInto } — `name` is the final spelling (an existing category's if it matches ignoring case),
 * `ids` the foods to update, `mergeInto` the existing category it will be merged into (or null).
 */
export function planRename(foods, from, to) {
  const target = to.trim()
  const existing = categoryCounts(foods).find((c) => c.name !== from && c.name.toLowerCase() === target.toLowerCase())
  const name = existing ? existing.name : target
  const ids = (foods ?? []).filter((f) => f.category === from).map((f) => f.id)
  return { name, ids, mergeInto: existing ? existing.name : null }
}
