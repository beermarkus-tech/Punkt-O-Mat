import { useEffect, useState } from 'react'
import { useData } from '../DataContext'
import { useDocument } from '../hooks/useDocument'
import { useToast } from '../components/ToastContext'
import SegmentedControl from '../components/SegmentedControl'
import { persist } from '../data'
import { formatDateLabel, suggestSection, todayId } from '../lib/dates'
import { addToLog } from '../lib/log'
import FoodPicker from './hinzufuegen/FoodPicker'
import FoodSheet from './hinzufuegen/FoodSheet'
import SportPicker from './hinzufuegen/SportPicker'
import SportSheet from './hinzufuegen/SportSheet'
import FoodForm from './datenbank/FoodForm'

const MODES = [
  { value: 'food', label: 'Lebensmittel' },
  { value: 'sport', label: 'Sport' },
]

export default function Hinzufuegen({ date }) {
  const { foods, settings } = useData()
  const log = useDocument('dailyLogs', date)
  const toast = useToast()
  const [mode, setMode] = useState('food')
  const [query, setQuery] = useState('')
  const [food, setFood] = useState(null)
  const [sport, setSport] = useState(null)
  const [creating, setCreating] = useState(null) // prefilled name for a new food
  const [pendingFoodId, setPendingFoodId] = useState(null)

  // After "neu anlegen": open the sheet as soon as the new food shows up in the catalog.
  useEffect(() => {
    if (!pendingFoodId || !foods) return
    const created = foods.find((f) => f.id === pendingFoodId)
    if (created) {
      setFood(created)
      setPendingFoodId(null)
    }
  }, [pendingFoodId, foods])

  const add = (field, item) => {
    persist(addToLog({ date, log, settings, field, item }), toast)
    toast('Hinzugefügt')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-extrabold">Hinzufügen</h1>
        {date !== todayId() && <p className="mt-1 font-semibold text-primary">{formatDateLabel(date)}</p>}
      </div>
      <SegmentedControl options={MODES} value={mode} onChange={setMode} />

      {mode === 'food' ? (
        <FoodPicker query={query} onQuery={setQuery} onPick={setFood} onCreate={setCreating} />
      ) : (
        <SportPicker onPick={setSport} />
      )}

      {food && (
        <FoodSheet
          key={food.id}
          food={food}
          initial={{ section: suggestSection() }}
          submitText="Hinzufügen"
          onClose={() => setFood(null)}
          onSubmit={(entry) => {
            add('entries', { ...entry, foodId: food.id })
            setFood(null)
            setQuery('')
          }}
        />
      )}
      {sport && (
        <SportSheet
          key={sport.id}
          sport={sport}
          submitText="Hinzufügen"
          onClose={() => setSport(null)}
          onSubmit={(entry) => {
            add('sport', { ...entry, sportId: sport.id })
            setSport(null)
          }}
        />
      )}
      {creating !== null && (
        <FoodForm
          food={null}
          initialName={creating}
          onClose={(savedId) => {
            setCreating(null)
            if (savedId) setPendingFoodId(savedId)
          }}
        />
      )}
    </div>
  )
}
