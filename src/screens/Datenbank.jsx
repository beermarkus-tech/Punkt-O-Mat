import { useEffect, useState } from 'react'
import SegmentedControl from '../components/SegmentedControl'
import Fab from '../components/Fab'
import FoodList from './datenbank/FoodList'
import FoodForm from './datenbank/FoodForm'
import SportList from './datenbank/SportList'
import SportForm from './datenbank/SportForm'
import TrackerList from './datenbank/TrackerList'
import TrackerForm from './datenbank/TrackerForm'
import RecipeForm from './datenbank/RecipeForm'
import BottomSheet from '../components/BottomSheet'
import { isRecipe } from '../lib/recipes'

const TYPES = [
  { value: 'foods', label: 'Lebensmittel', add: 'Lebensmittel hinzufügen' },
  { value: 'sports', label: 'Sport', add: 'Sportart hinzufügen' },
  { value: 'trackers', label: 'Tracker', add: 'Tracker hinzufügen' },
]

export default function Datenbank({ draft, onDraftUsed }) {
  const [type, setType] = useState('foods')
  // { type, item } — item null means "new"
  const [editing, setEditing] = useState(() => (draft ? { type: 'foods', item: null, initial: draft } : null))
  const open = (item) => setEditing({ type: type === 'foods' && isRecipe(item) ? 'recipes' : type, item })
  const [choosing, setChoosing] = useState(false) // "+" on Lebensmittel: plain food or recipe?
  const close = () => setEditing(null)
  useEffect(() => {
    if (draft) onDraftUsed?.() // the prefilled form is open now; don't reopen it on the next visit
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold">Datenbank</h1>
      <SegmentedControl options={TYPES} value={type} onChange={setType} />

      {type === 'foods' && <FoodList onOpen={open} />}
      {type === 'sports' && <SportList onOpen={open} />}
      {type === 'trackers' && <TrackerList onOpen={open} />}

      {/* Keep the last row clear of the floating button. */}
      <div className="h-16" aria-hidden="true" />

      <Fab onClick={() => (type === 'foods' ? setChoosing(true) : open(null))} label={TYPES.find((t) => t.value === type).add} />

      {choosing && (
        <BottomSheet onClose={() => setChoosing(false)} label="Neu anlegen">
          <h2 className="mb-4 text-xl font-bold">Neu anlegen</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['foods', 'Lebensmittel', 'mit kcal und Fett'],
              ['recipes', 'Rezept', 'aus Zutaten'],
            ].map(([t, title, hint]) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setChoosing(false)
                  setEditing({ type: t, item: null })
                }}
                className="flex flex-col items-start rounded-card border border-border bg-bg px-4 py-4 text-left active:border-primary"
              >
                <span className="text-lg font-bold">{title}</span>
                <span className="text-sm text-muted">{hint}</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {editing?.type === 'foods' && <FoodForm food={editing.item} initial={editing.initial} onClose={close} />}
      {editing?.type === 'recipes' && <RecipeForm recipe={editing.item} onClose={close} />}
      {editing?.type === 'sports' && <SportForm sport={editing.item} onClose={close} />}
      {editing?.type === 'trackers' && <TrackerForm tracker={editing.item} onClose={close} />}
    </div>
  )
}
