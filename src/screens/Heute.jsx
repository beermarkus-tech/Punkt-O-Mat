import { useMemo, useState } from 'react'
import { useData } from '../DataContext'
import { useWeekLogs } from '../hooks/useWeekLogs'
import { useToast } from '../components/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import { deleteButtonClass } from '../components/form'
import { persist } from '../data'
import { formatPoints } from '../lib/format'
import { SECTIONS, todayId, weekDates } from '../lib/dates'
import { entryLabel, sportLabel } from '../lib/entries'
import { removeFromLog, replaceInLog, updateLog } from '../lib/log'
import { computeWeek } from '../lib/week'
import DateHeader from './heute/DateHeader'
import SummaryCard from './heute/SummaryCard'
import Section, { EntryRow } from './heute/Section'
import TrackerCard from './heute/TrackerCard'
import WeightRow from './heute/WeightRow'
import FoodSheet from './hinzufuegen/FoodSheet'
import SportSheet from './hinzufuegen/SportSheet'

/** Units to offer when editing an entry: the food's current units, plus the logged unit if it no longer exists. */
function unitsForEntry(entry, food) {
  // The logged unit keeps its logged grams, so editing never silently changes the snapshot (spec.md §4.6).
  const units = (food?.units?.length ? food.units : [{ label: '100 g', grams: 100 }]).map((u) =>
    u.label === entry.unitLabel ? { ...u, grams: entry.unitGrams } : u,
  )
  if (entry.unitLabel !== 'g' && !units.some((u) => u.label === entry.unitLabel)) {
    units.push({ label: entry.unitLabel, grams: entry.unitGrams })
  }
  return units
}

export default function Heute({ date, onDateChange }) {
  const { foods, trackers, settings } = useData()
  const toast = useToast()
  const dates = useMemo(() => weekDates(date), [date])
  const logs = useWeekLogs(dates)
  const [open, setOpen] = useState(() => new Set())
  const [editing, setEditing] = useState(null) // { field: 'entries' | 'sport', item }
  const [confirming, setConfirming] = useState(false)

  if (logs === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <DateHeader date={date} onChange={onDateChange} />
        <Spinner inline />
      </div>
    )
  }

  const log = logs[date] ?? null
  const { weeklyBonus, days } = computeWeek(dates, logs, settings)
  const day = days[date]
  const entries = log?.entries ?? []
  const sport = log?.sport ?? []

  const toggle = (id) =>
    setOpen((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const write = (data) => persist(updateLog({ date, log, settings, data }), toast)
  const closeEdit = () => {
    setEditing(null)
    setConfirming(false)
  }
  const saveEdit = (fields) => {
    persist(replaceInLog({ date, log, field: editing.field, item: { ...editing.item, ...fields } }), toast)
    closeEdit()
  }
  const deleteEdit = () => {
    persist(removeFromLog({ date, log, field: editing.field, id: editing.item.id }), toast)
    closeEdit()
  }
  const deleteButton = (
    <button type="button" onClick={() => setConfirming(true)} className={`${deleteButtonClass} mt-2`}>
      Löschen
    </button>
  )

  const editingFood = editing?.field === 'entries' ? foods?.find((f) => f.id === editing.item.foodId) : null
  const sortedTrackers = [...(trackers ?? [])].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-4">
      <DateHeader date={date} onChange={onDateChange} />
      <SummaryCard day={day} weeklyBonus={weeklyBonus} />

      <div className="flex flex-col gap-3">
        {SECTIONS.map((s) => {
          const items = entries.filter((e) => e.section === s.id)
          const total = items.reduce((sum, e) => sum + e.points, 0)
          return (
            <Section
              key={s.id}
              title={s.label}
              total={`${formatPoints(total)} Pkt.`}
              totalClass={total !== 0 ? 'font-bold text-primary' : 'text-muted'}
              open={open.has(s.id)}
              onToggle={() => toggle(s.id)}
              empty={!items.length}
            >
              {items.map((e) => (
                <EntryRow
                  key={e.id}
                  label={entryLabel(e)}
                  points={formatPoints(e.points)}
                  pointsClass={e.points !== 0 ? 'font-semibold text-primary' : ''}
                  onClick={() => setEditing({ field: 'entries', item: e })}
                />
              ))}
            </Section>
          )
        })}
        <Section
          title="Aktivität"
          total={`${formatPoints(-day.sportTotal)} Pkt.`}
          totalClass={day.sportTotal > 0 ? 'font-bold text-primary' : 'text-muted'}
          open={open.has('aktivitaet')}
          onToggle={() => toggle('aktivitaet')}
          empty={!sport.length}
        >
          {sport.map((s) => (
            <EntryRow
              key={s.id}
              label={sportLabel(s)}
              points={formatPoints(-s.points)}
              pointsClass="font-semibold text-primary"
              onClick={() => setEditing({ field: 'sport', item: s })}
            />
          ))}
        </Section>
      </div>

      {sortedTrackers.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {sortedTrackers.map((t) => (
            <TrackerCard
              key={t.id}
              tracker={t}
              value={log?.trackerValues?.[t.id] ?? 0}
              onChange={(v) => write({ trackerValues: { [t.id]: v } })}
            />
          ))}
        </div>
      )}

      <WeightRow
        key={date}
        label={date === todayId() ? 'Gewicht heute' : 'Gewicht'}
        weight={log?.weight ?? null}
        onSave={(kg) => write({ weight: kg })}
      />

      {editing?.field === 'entries' && (
        <FoodSheet
          key={editing.item.id}
          food={{
            name: editing.item.foodName,
            category: editingFood?.category ?? '',
            kcal_100: editing.item.kcal_100, // points always come from the entry's own snapshot (spec.md §4.1)
            fat_100: editing.item.fat_100,
            units: unitsForEntry(editing.item, editingFood),
          }}
          initial={{ unitLabel: editing.item.unitLabel, qty: editing.item.qty, section: editing.item.section }}
          submitText="Speichern"
          onSubmit={saveEdit}
          onClose={closeEdit}
        >
          {deleteButton}
        </FoodSheet>
      )}
      {editing?.field === 'sport' && (
        <SportSheet
          key={editing.item.id}
          sport={{ name: editing.item.sportName, pointsPer30Min: editing.item.pointsPer30Min }}
          initialMinutes={editing.item.minutes}
          submitText="Speichern"
          onSubmit={saveEdit}
          onClose={closeEdit}
        >
          {deleteButton}
        </SportSheet>
      )}
      {confirming && <ConfirmDialog onCancel={() => setConfirming(false)} onConfirm={deleteEdit} />}
    </div>
  )
}
