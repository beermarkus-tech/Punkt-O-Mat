import { useMemo, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { useData } from '../../DataContext'
import SearchInput from '../../components/SearchInput'
import Spinner from '../../components/Spinner'
import Chip from '../../components/Chip'
import { formatPoints } from '../../lib/format'
import { displayRef, foodPoints } from '../../lib/points'
import { isRecipe } from '../../lib/recipes'
import { byName, matches } from '../../lib/text'

/** Search + category chips + result list. The parent owns the query so it can clear it after adding. */
export default function FoodPicker({ query, onQuery, onPick, onCreate }) {
  const { foods } = useData()
  const [category, setCategory] = useState(null)

  const categories = useMemo(
    () => [...new Set((foods ?? []).map((f) => f.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')),
    [foods],
  )
  const results = useMemo(
    () =>
      (foods ?? [])
        .filter((f) => (!category || f.category === category) && matches(f.name, query))
        .sort(byName),
    [foods, category, query],
  )

  if (!foods) return <Spinner inline />

  return (
    <div className="flex flex-col gap-3">
      <SearchInput value={query} onChange={onQuery} />
      {categories.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip className="rounded-full" active={!category} onClick={() => setCategory(null)}>
            Alle
          </Chip>
          {categories.map((c) => (
            <Chip key={c} className="rounded-full" active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      {results.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onPick(f)}
          className="flex items-center gap-3 rounded-card border border-border bg-card px-5 py-3.5 text-left active:border-primary"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-semibold">{f.name}</span>
            <span className="block truncate text-sm text-muted">
              {f.category} ·{' '}
              {isRecipe(f)
                ? `${formatPoints(foodPoints({ ...f, qty: 1, unitGrams: f.units[1].grams }))} Pkt / Portion`
                : `${formatPoints(displayRef(f.kcal_100, f.fat_100))} Pkt / 100 g`}
            </span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-muted" />
        </button>
      ))}

      {results.length === 0 && query.trim() && (
        <button
          type="button"
          onClick={() => onCreate(query.trim())}
          className="flex items-center justify-center gap-2 rounded-card border border-dashed border-primary bg-card px-5 py-4 font-semibold text-primary"
        >
          <Plus size={20} /> „{query.trim()}“ neu anlegen
        </button>
      )}
      {results.length === 0 && !query.trim() && (
        <p className="py-8 text-center text-muted">
          {foods.length === 0 ? 'Noch keine Lebensmittel – in der Datenbank anlegen' : 'Keine Treffer'}
        </p>
      )}
    </div>
  )
}
