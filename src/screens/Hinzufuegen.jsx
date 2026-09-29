import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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
import QuickEntryForm from './hinzufuegen/QuickEntryForm'
import FoodForm from './datenbank/FoodForm'

const MODES = [
  { value: 'food', label: 'Lebensmittel' },
  { value: 'sport', label: 'Sport' },
  { value: 'quick', label: 'Frei' },
]

/**
 * Full-screen "Hinzufügen" panel, opened by the "+" on Heute or from Rechner (spec.md §4.2).
 * Logs to `date`, the day selected on Heute. `prefill` = { kcal, fat } for the free entry.
 */
export default function Hinzufuegen({ date, initialMode = 'food', prefill, onClose }) {
  const { foods, settings } = useData()
  const log = useDocument('dailyLogs', date)
  const toast = useToast()
  const [mode, setMode] = useState(initialMode)
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

  // Every successful add closes the whole panel and returns to Heute (spec.md §4.2).
  const add = (field, item) => {
    persist(addToLog({ date, log, settings, field, item }), toast)
    toast('Hinzugefügt')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pt-4 pb-10">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onClose} aria-label="Schließen" className="-ml-2 rounded-full p-2 active:bg-border">
            <X size={26} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold">Hinzufügen</h1>
            {date !== todayId() && <p className="font-semibold text-primary">{formatDateLabel(date)}</p>}
          </div>
        </div>
        <SegmentedControl options={MODES} value={mode} onChange={setMode} />

        {mode === 'food' && <FoodPicker query={query} onQuery={setQuery} onPick={setFood} onCreate={setCreating} />}
        {mode === 'sport' && <SportPicker onPick={setSport} />}
        {mode === 'quick' && (
          <div className="rounded-card border border-border bg-card p-4">
            <QuickEntryForm initial={prefill} submitText="Hinzufügen" onSubmit={(entry) => add('entries', entry)} />
          </div>
        )}
      </div>

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
