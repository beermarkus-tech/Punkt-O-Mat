import { useState } from 'react'
import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useData } from '../../DataContext'
import { useToast } from '../../components/ToastContext'
import { persist } from '../../data'
import Sheet from '../../components/Sheet'
import ConfirmDialog from '../../components/ConfirmDialog'
import { deleteButtonClass, Field, inputClass, numberError, primaryButtonClass } from '../../components/form'
import { parseNumber, toInput } from '../../lib/format'

function validate({ id, name, points }, sports) {
  const e = {}
  const n = name.trim().toLowerCase()
  if (!n) e.name = 'Pflichtfeld'
  else if (sports.some((s) => s.id !== id && s.name.trim().toLowerCase() === n)) e.name = 'Diesen Namen gibt es schon'
  const p = parseNumber(points)
  const pErr = numberError(points, p, { positive: true })
  if (pErr) e.points = pErr
  else if (Math.abs(p * 2 - Math.round(p * 2)) > 1e-9) e.points = 'Nur in 0,5er-Schritten'
  return e
}

export default function SportForm({ sport, onClose }) {
  const { sports } = useData()
  const toast = useToast()
  const [name, setName] = useState(sport?.name ?? '')
  const [points, setPoints] = useState(toInput(sport?.pointsPer30Min))
  const [submitted, setSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const errors = validate({ id: sport?.id, name, points }, sports ?? [])
  const shown = submitted ? errors : {}

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    const data = { name: name.trim(), pointsPer30Min: parseNumber(points) }
    const ref = sport ? doc(db, 'sports', sport.id) : doc(collection(db, 'sports'))
    persist(sport ? updateDoc(ref, data) : setDoc(ref, data), toast)
    onClose(ref.id)
  }

  const remove = () => {
    persist(deleteDoc(doc(db, 'sports', sport.id)), toast)
    onClose()
  }

  return (
    <Sheet
      title={sport ? 'Sportart bearbeiten' : 'Neue Sportart'}
      onClose={() => onClose()}
      footer={
        <>
          <button type="button" onClick={save} className={primaryButtonClass}>
            Speichern
          </button>
          {sport && (
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
      <Field label="Punkte pro 30 Min" required error={shown.points}>
        <input inputMode="decimal" value={points} onChange={(e) => setPoints(e.target.value)} className={inputClass(shown.points)} />
      </Field>
      {confirming && <ConfirmDialog onCancel={() => setConfirming(false)} onConfirm={remove} />}
    </Sheet>
  )
}
