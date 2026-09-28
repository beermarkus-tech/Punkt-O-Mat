import { useState } from 'react'
import BottomSheet from '../../components/BottomSheet'
import Chip from '../../components/Chip'
import Stepper from '../../components/Stepper'
import { inputClass } from '../../components/form'
import { formatPoints, parseNumber } from '../../lib/format'
import { foodPoints } from '../../lib/points'
import { SECTIONS } from '../../lib/dates'
import { unitChipLabel } from '../../lib/entries'

const GRAMS = 'g'
const label = 'text-xs font-bold tracking-wider text-muted uppercase'

/**
 * Choose size, amount and Rubrik for a food (spec.md §4.2).
 * `food` needs name, category, kcal_100, fat_100, units. `initial`: { unitLabel, qty, section }.
 * onSubmit receives the entry fields (without id/loggedAt).
 */
export default function FoodSheet({ food, initial, submitText, onSubmit, onClose, children }) {
  const units = food.units?.length ? food.units : [{ label: '100 g', grams: 100 }]
  const [unit, setUnit] = useState(() => {
    if (initial?.unitLabel) return initial.unitLabel
    return (units[1] ?? units[0]).label
  })
  const [qty, setQty] = useState(initial?.unitLabel && initial.unitLabel !== GRAMS ? initial.qty : 1)
  const [grams, setGrams] = useState(initial?.unitLabel === GRAMS ? String(initial.qty) : '')
  const [section, setSection] = useState(initial.section)

  const isGrams = unit === GRAMS
  const gramValue = parseNumber(grams)
  const validGrams = Number.isInteger(gramValue) && gramValue > 0
  const unitGrams = isGrams ? 1 : (units.find((u) => u.label === unit)?.grams ?? 100)
  const amount = isGrams ? (validGrams ? gramValue : 0) : qty
  const points = foodPoints({ qty: amount, unitGrams, kcal_100: food.kcal_100, fat_100: food.fat_100 })
  const canSubmit = !isGrams || validGrams

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      section,
      foodName: food.name,
      kcal_100: food.kcal_100,
      fat_100: food.fat_100,
      unitLabel: isGrams ? GRAMS : unit,
      unitGrams,
      qty: amount,
      points,
    })
  }

  return (
    <BottomSheet onClose={onClose} label={food.name}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{food.name}</h2>
          <p className="text-muted">{food.category}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl leading-none font-extrabold text-primary tabular-nums">{formatPoints(points)}</div>
          <div className="text-sm text-muted">Pkt.</div>
        </div>
      </div>

      <div className="mt-5">
        <h3 className={`${label} mb-2`}>Größe</h3>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {units.map((u) => (
            <Chip key={u.label} variant="soft" className="rounded-chip" active={unit === u.label} onClick={() => setUnit(u.label)}>
              {unitChipLabel(u.label)}
            </Chip>
          ))}
          <Chip variant="soft" className="rounded-chip" active={isGrams} onClick={() => setUnit(GRAMS)}>
            Gramm
          </Chip>
        </div>
      </div>

      <div className="mt-5 flex min-h-11 items-center justify-between gap-4">
        <h3 className={label}>Menge</h3>
        {isGrams ? (
          <div className="relative w-36">
            <input
              inputMode="numeric"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="Gramm"
              aria-label="Gramm"
              autoFocus
              className={`${inputClass(grams !== '' && !validGrams)} pr-8 text-right`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">g</span>
          </div>
        ) : (
          <Stepper value={qty} onChange={setQty} step={0.5} min={0.5} />
        )}
      </div>

      <div className="mt-5">
        <h3 className={`${label} mb-2`}>Rubrik</h3>
        <div className="grid grid-cols-2 gap-2">
          {SECTIONS.map((s) => (
            <Chip key={s.id} className="rounded-chip" active={section === s.id} onClick={() => setSection(s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="mt-6 w-full rounded-chip bg-primary py-4 text-lg font-semibold text-white active:opacity-80 disabled:opacity-40"
      >
        {submitText} · {formatPoints(points)} Pkt.
      </button>
      {children}
    </BottomSheet>
  )
}
