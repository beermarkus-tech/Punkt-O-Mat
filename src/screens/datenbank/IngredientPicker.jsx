import { useMemo, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { useData } from '../../DataContext'
import SearchInput from '../../components/SearchInput'
import { formatPoints } from '../../lib/format'
import { displayRef } from '../../lib/points'
import { isRecipe } from '../../lib/recipes'
import { byName, matches } from '../../lib/text'

/** Full-screen search over plain foods (no recipes inside recipes, spec.md §4.6). */
export default function IngredientPicker({ onPick, onClose }) {
  const { foods } = useData()
  const [query, setQuery] = useState('')
  const results = useMemo(
    () => (foods ?? []).filter((f) => !isRecipe(f) && matches(f.name, query)).sort(byName),
    [foods, query],
  )

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-bg">
      <div className="mx-auto flex max-w-[480px] flex-col gap-3 px-4 pt-4 pb-8">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onClose} aria-label="Schließen" className="-ml-2 rounded-full p-2 active:bg-border">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold">Zutat wählen</h2>
        </div>
        <SearchInput value={query} onChange={setQuery} />
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
                {f.category} · {formatPoints(displayRef(f.kcal_100, f.fat_100))} Pkt / 100 g
              </span>
            </span>
            <ChevronRight size={20} className="shrink-0 text-muted" />
          </button>
        ))}
        {results.length === 0 && <p className="py-8 text-center text-muted">Keine Treffer</p>}
      </div>
    </div>
  )
}
