import { useMemo, useState } from 'react'
import Chip from './Chip'

/**
 * Category filter state for a food list: all categories in use (alphabetical), the selected one,
 * and a `matches(food)` test. A selection that no longer exists (e.g. after renaming) counts as "Alle".
 */
export function useCategoryFilter(foods) {
  const [selected, setSelected] = useState(null)
  const categories = useMemo(
    () => [...new Set((foods ?? []).map((f) => f.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')),
    [foods],
  )
  const category = categories.includes(selected) ? selected : null
  return { categories, category, setCategory: setSelected, matches: (food) => !category || food.category === category }
}

/** "Alle" + one chip per category, single select, scrolls sideways. Shared by Hinzufügen and Datenbank (spec.md §4.2, §4.3). */
export default function CategoryChips({ categories, category, onChange }) {
  if (!categories.length) return null
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Chip className="rounded-full" active={!category} onClick={() => onChange(null)}>
        Alle
      </Chip>
      {categories.map((c) => (
        <Chip key={c} className="rounded-full" active={category === c} onClick={() => onChange(c)}>
          {c}
        </Chip>
      ))}
    </div>
  )
}
