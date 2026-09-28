import { useState } from 'react'
import { SquarePlus } from 'lucide-react'
import BottomSheet from '../../components/BottomSheet'
import { inputClass, primaryButtonClass } from '../../components/form'
import { parseNumber } from '../../lib/format'

export const formatWeight = (kg) => `${kg.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`

/** Weight input: one decimal, 30–300 kg; empty clears the value (spec.md §4.1). onSave(number | null). */
export function WeightSheet({ title, initial, onSave, onClose }) {
  const [text, setText] = useState(initial == null ? '' : formatWeight(initial).replace(' kg', ''))
  const [error, setError] = useState(null)

  const save = () => {
    if (text.trim() === '') return onSave(null)
    const kg = parseNumber(text)
    if (!(kg >= 30 && kg <= 300)) return setError('Bitte zwischen 30 und 300 kg eingeben')
    onSave(Math.round(kg * 10) / 10)
  }

  return (
    <BottomSheet onClose={onClose} label={title}>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="relative">
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="z. B. 102,0"
          aria-label="Gewicht in kg"
          autoFocus
          className={`${inputClass(error)} pr-12 text-2xl`}
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-muted">kg</span>
      </div>
      {error && <p className="mt-1.5 text-sm text-accent">{error}</p>}
      <button type="button" onClick={save} className={`${primaryButtonClass} mt-6`}>
        Speichern
      </button>
    </BottomSheet>
  )
}

export default function WeightRow({ label, weight, onSave }) {
  const [editing, setEditing] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-3 rounded-card border border-border bg-card px-5 py-4 text-left active:bg-bg"
      >
        <SquarePlus size={22} />
        <span className="flex-1 text-lg font-bold">{label}</span>
        <span className="rounded-chip bg-primary-soft px-4 py-2 text-lg font-bold text-primary tabular-nums">
          {weight == null ? '–' : formatWeight(weight)}
        </span>
      </button>
      {editing && (
        <WeightSheet
          title={label}
          initial={weight}
          onClose={() => setEditing(false)}
          onSave={(kg) => {
            onSave(kg)
            setEditing(false)
          }}
        />
      )}
    </>
  )
}
