import { useMemo, useState } from 'react'
import { useData } from '../../DataContext'
import SearchInput from '../../components/SearchInput'
import Spinner from '../../components/Spinner'
import { formatRef } from '../../lib/format'
import { refValue } from '../../lib/points'
import { byName, letterOf, matches } from '../../lib/text'

function subtitle(food) {
  if (food.remark) return food.remark
  const n = food.units?.length ?? 1
  return `${food.category} · ${n} ${n === 1 ? 'Größe' : 'Größen'}`
}

export default function FoodList({ onOpen }) {
  const { foods } = useData()
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const list = (foods ?? []).filter((f) => matches(f.name, query)).sort(byName)
    const map = new Map()
    for (const f of list) {
      const letter = letterOf(f.name)
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter).push(f)
    }
    return [...map.entries()]
  }, [foods, query])

  if (!foods) return <Spinner inline />

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={query} onChange={setQuery} />
      {groups.length === 0 && (
        <p className="py-8 text-center text-muted">{foods.length === 0 ? 'Noch keine Lebensmittel' : 'Keine Treffer'}</p>
      )}
      {groups.map(([letter, items]) => (
        <section key={letter} className="flex flex-col gap-2">
          <h3 className="px-1 pt-2 text-sm font-bold text-muted">{letter}</h3>
          {items.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onOpen(f)}
              className="flex items-center gap-3 rounded-card border border-border bg-card px-5 py-3.5 text-left active:border-primary"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold">{f.name}</span>
                <span className="block truncate text-sm text-muted">{subtitle(f)}</span>
              </span>
              <span className="text-lg font-bold text-primary">{formatRef(refValue(f.kcal_100, f.fat_100))}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}
