import { useState } from 'react'
import Chip from '../../components/Chip'
import { Field, inputClass, numberError } from '../../components/form'
import { formatPoints, parseNumber, toInput } from '../../lib/format'
import { quickPoints } from '../../lib/points'
import { SECTIONS, suggestSection } from '../../lib/dates'

/**
 * Free entry ("Frei", spec.md §4.2): title + total kcal + total fat → points, rounded once.
 * `initial` may hold { foodName, kcal, fat, section } (editing, or prefilled from Rechner).
 * onSubmit receives the entry fields (without id/loggedAt).
 */
export default function QuickEntryForm({ initial, submitText, onSubmit, children }) {
  const [title, setTitle] = useState(initial?.foodName ?? '')
  const [kcal, setKcal] = useState(toInput(initial?.kcal))
  const [fat, setFat] = useState(toInput(initial?.fat))
  const [section, setSection] = useState(initial?.section ?? suggestSection())
  const [submitted, setSubmitted] = useState(false)

  const k = parseNumber(kcal)
  const f = parseNumber(fat)
  const errors = {}
  if (!title.trim()) errors.title = 'Pflichtfeld'
  const kErr = numberError(kcal, k)
  if (kErr) errors.kcal = kErr
  const fErr = numberError(fat, f)
  if (fErr) errors.fat = fErr
  const shown = submitted ? errors : {}
  const points = k >= 0 && f >= 0 ? quickPoints({ kcal: k, fat: f }) : 0

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    onSubmit({ type: 'quick', foodName: title.trim(), kcal: k, fat: f, section, points })
    // Ready for the next one (the parent may also close the form).
    setTitle('')
    setKcal('')
    setFat('')
    setSubmitted(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Field label="Titel" required error={shown.title}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Pizza beim Italiener" className={inputClass(shown.title)} />
          </Field>
        </div>
        <div className="pt-6 text-right">
          <div className="text-4xl leading-none font-extrabold text-primary tabular-nums">{formatPoints(points)}</div>
          <div className="text-sm text-muted">Pkt.</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="kcal gesamt" required error={shown.kcal}>
          <input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} className={inputClass(shown.kcal)} />
        </Field>
        <Field label="Fett gesamt (g)" required error={shown.fat}>
          <input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className={inputClass(shown.fat)} />
        </Field>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Rubrik</h3>
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
        className="mt-2 w-full rounded-chip bg-primary py-4 text-lg font-semibold text-white active:opacity-80"
      >
        {submitText} · {formatPoints(points)} Pkt.
      </button>
      {children}
    </div>
  )
}
