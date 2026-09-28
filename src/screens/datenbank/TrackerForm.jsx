import { useState } from 'react'
import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore'
import { Check } from 'lucide-react'
import { db } from '../../firebase'
import { useData } from '../../DataContext'
import { useToast } from '../../components/ToastContext'
import { persist } from '../../data'
import Sheet from '../../components/Sheet'
import ConfirmDialog from '../../components/ConfirmDialog'
import { deleteButtonClass, Field, inputClass, numberError, primaryButtonClass } from '../../components/form'
import { parseNumber, toInput } from '../../lib/format'
import { TRACKER_COLORS, TRACKER_ICONS } from '../../trackerStyle'

function validate({ name, unit, target, step }) {
  const e = {}
  if (!name.trim()) e.name = 'Pflichtfeld'
  if (!unit.trim()) e.unit = 'Pflichtfeld'
  const tErr = numberError(target, parseNumber(target), { positive: true })
  if (tErr) e.target = tErr
  const sErr = numberError(step, parseNumber(step), { positive: true })
  if (sErr) e.step = sErr
  return e
}

export default function TrackerForm({ tracker, onClose }) {
  const { trackers } = useData()
  const toast = useToast()
  const [name, setName] = useState(tracker?.name ?? '')
  const [unit, setUnit] = useState(tracker?.unit ?? '')
  const [target, setTarget] = useState(toInput(tracker?.dailyTarget))
  const [step, setStep] = useState(toInput(tracker?.step ?? 1))
  const [icon, setIcon] = useState(tracker?.icon ?? 'droplet')
  const [color, setColor] = useState(tracker?.color ?? 'green')
  const [submitted, setSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const errors = validate({ name, unit, target, step })
  const shown = submitted ? errors : {}
  const colorHex = TRACKER_COLORS[color].hex

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    const data = {
      name: name.trim(),
      unit: unit.trim(),
      dailyTarget: parseNumber(target),
      step: parseNumber(step),
      icon,
      color,
    }
    if (tracker) {
      persist(updateDoc(doc(db, 'trackers', tracker.id), data), toast)
      onClose(tracker.id)
    } else {
      const order = Math.max(0, ...(trackers ?? []).map((t) => t.order ?? 0)) + 1
      const ref = doc(collection(db, 'trackers'))
      persist(setDoc(ref, { ...data, order }), toast)
      onClose(ref.id)
    }
  }

  const remove = () => {
    persist(deleteDoc(doc(db, 'trackers', tracker.id)), toast)
    onClose()
  }

  return (
    <Sheet
      title={tracker ? 'Tracker bearbeiten' : 'Neuer Tracker'}
      onClose={() => onClose()}
      footer={
        <>
          <button type="button" onClick={save} className={primaryButtonClass}>
            Speichern
          </button>
          {tracker && (
            <button type="button" onClick={() => setConfirming(true)} className={deleteButtonClass}>
              Löschen
            </button>
          )}
        </>
      }
    >
      <Field label="Name" required error={shown.name}>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass(shown.name)} />
      </Field>
      <Field label="Einheit" required error={shown.unit}>
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="z. B. Gläser" className={inputClass(shown.unit)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tagesziel" required error={shown.target}>
          <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass(shown.target)} />
        </Field>
        <Field label="Schritt" error={shown.step}>
          <input inputMode="decimal" value={step} onChange={(e) => setStep(e.target.value)} className={inputClass(shown.step)} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-muted">Symbol</legend>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(TRACKER_ICONS).map(([key, { Icon, label }]) => {
            const active = key === icon
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                aria-label={label}
                aria-pressed={active}
                className={`flex h-14 items-center justify-center rounded-chip border-2 bg-card ${active ? '' : 'border-border text-muted'}`}
                style={active ? { borderColor: colorHex, color: colorHex, background: `${colorHex}14` } : undefined}
              >
                <Icon size={24} />
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-muted">Farbe</legend>
        <div className="flex gap-3">
          {Object.entries(TRACKER_COLORS).map(([key, { hex, label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setColor(key)}
              aria-label={label}
              aria-pressed={key === color}
              className="flex size-12 items-center justify-center rounded-full text-white"
              style={{ background: hex, boxShadow: key === color ? `0 0 0 3px #F8F7F4, 0 0 0 5px ${hex}` : undefined }}
            >
              {key === color && <Check size={22} />}
            </button>
          ))}
        </div>
      </fieldset>

      {confirming && <ConfirmDialog onCancel={() => setConfirming(false)} onConfirm={remove} />}
    </Sheet>
  )
}
