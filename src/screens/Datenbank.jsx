import { useState } from 'react'
import SegmentedControl from '../components/SegmentedControl'
import Fab from '../components/Fab'
import FoodList from './datenbank/FoodList'
import FoodForm from './datenbank/FoodForm'
import SportList from './datenbank/SportList'
import SportForm from './datenbank/SportForm'
import TrackerList from './datenbank/TrackerList'
import TrackerForm from './datenbank/TrackerForm'

const TYPES = [
  { value: 'foods', label: 'Lebensmittel', add: 'Lebensmittel hinzufügen' },
  { value: 'sports', label: 'Sport', add: 'Sportart hinzufügen' },
  { value: 'trackers', label: 'Tracker', add: 'Tracker hinzufügen' },
]

export default function Datenbank() {
  const [type, setType] = useState('foods')
  // { type, item } — item null means "new"
  const [editing, setEditing] = useState(null)
  const open = (item) => setEditing({ type, item })
  const close = () => setEditing(null)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold">Datenbank</h1>
      <SegmentedControl options={TYPES} value={type} onChange={setType} />

      {type === 'foods' && <FoodList onOpen={open} />}
      {type === 'sports' && <SportList onOpen={open} />}
      {type === 'trackers' && <TrackerList onOpen={open} />}

      {/* Keep the last row clear of the floating button. */}
      <div className="h-16" aria-hidden="true" />

      <Fab onClick={() => open(null)} label={TYPES.find((t) => t.value === type).add} />

      {editing?.type === 'foods' && <FoodForm food={editing.item} onClose={close} />}
      {editing?.type === 'sports' && <SportForm sport={editing.item} onClose={close} />}
      {editing?.type === 'trackers' && <TrackerForm tracker={editing.item} onClose={close} />}
    </div>
  )
}
