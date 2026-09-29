import { formatNumber } from './format'

/** Chip text for a unit: "100 g" stays, named units get a count ("1 Klein"). */
export function unitChipLabel(label) {
  return /^\d/.test(label) ? label : `1 ${label}`
}

/** Row text for a food entry (spec.md §4.1): "1 Klein Brezel", "35 g Brezel", "2 × 100 g Brezel". */
export function entryLabel({ type, qty, unitLabel, foodName }) {
  if (type === 'quick') return foodName // free entry: just its title (spec.md §4.2)
  const q = formatNumber(qty)
  if (unitLabel === 'g') return `${q} g ${foodName}`
  if (/^\d/.test(unitLabel)) return `${q} × ${unitLabel} ${foodName}`
  return `${q} ${unitLabel} ${foodName}`
}

export function sportLabel({ minutes, sportName }) {
  return `${formatNumber(minutes)} Min ${sportName}`
}
