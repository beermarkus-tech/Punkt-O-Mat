import { useMemo, useState } from 'react'
import { useData } from '../../DataContext'
import SearchInput from '../../components/SearchInput'
import CategoryChips, { useCategoryFilter } from '../../components/CategoryChips'
import CategoryManager from './CategoryManager'
import Spinner from '../../components/Spinner'
import { formatPoints } from '../../lib/format'
import { displayRef, foodPoints } from '../../lib/points'
import { isRecipe } from '../../lib/recipes'
import RecipeTag from '../../components/RecipeTag'
import { byName, matches } from '../../lib/text'

function subtitle(food) {
  if (food.remark) return food.remark
  if (isRecipe(food)) return `${food.category} · ${food.ingredients.map((i) => i.foodName).join(', ')}`
  const n = food.units?.length ?? 1
  return `${food.category} · ${n} ${n === 1 ? 'Größe' : 'Größen'}`
}

export default function FoodList({ onOpen }) {
  const { foods } = useData()
  const [query, setQuery] = useState('')
  const [managing, setManaging] = useState(false)

  const filter = useCategoryFilter(foods)
  const results = useMemo(
    () => (foods ?? []).filter((f) => filter.matches(f) && matches(f.name, query)).sort(byName),
    [foods, filter.category, query], // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!foods) return <Spinner inline />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput value={query} onChange={setQuery} />
        </div>
        <button
          type="button"
          onClick={() => setManaging(true)}
          className="shrink-0 rounded-card border border-border bg-card px-4 text-[15px] font-semibold text-primary active:border-primary"
        >
          Kategorien
        </button>
      </div>
      <CategoryChips categories={filter.categories} category={filter.category} onChange={filter.setCategory} />
      {managing && <CategoryManager onClose={() => setManaging(false)} />}
      {results.length === 0 && (
        <p className="py-8 text-center text-muted">{foods.length === 0 ? 'Noch keine Lebensmittel' : 'Keine Treffer'}</p>
      )}
      {results.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onOpen(f)}
          className="flex items-center gap-3 rounded-card border border-border bg-card px-5 py-3.5 text-left active:border-primary"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[17px] font-semibold">{f.name}</span>
              {isRecipe(f) && <RecipeTag />}
            </span>
            <span className="block truncate text-sm text-muted">{subtitle(f)}</span>
          </span>
          <span className="text-lg font-bold text-primary">
            {isRecipe(f)
              ? formatPoints(foodPoints({ ...f, qty: 1, unitGrams: f.units[1].grams }))
              : formatPoints(displayRef(f.kcal_100, f.fat_100))}
          </span>
        </button>
      ))}
    </div>
  )
}
