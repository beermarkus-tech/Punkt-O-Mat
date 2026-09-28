/** Lower-case and strip accents/umlaut dots, so "brotchen" matches "Brötchen" (spec.md §4.2). */
export function normalize(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function matches(name, query) {
  return normalize(name).includes(normalize(query.trim()))
}

export function byName(a, b) {
  return a.name.localeCompare(b.name, 'de')
}

/** Group letter for the Datenbank list: Ä/Ö/Ü sort with A/O/U (spec.md §4.3). */
export function letterOf(name) {
  const c = normalize(name).trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}
