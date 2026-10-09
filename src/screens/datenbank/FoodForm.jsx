import { useMemo, useState } from 'react'
import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { Lock, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { db } from '../../firebase'
import { useData } from '../../DataContext'
import { useToast } from '../../components/ToastContext'
import { persist } from '../../data'
import Sheet from '../../components/Sheet'
import ConfirmDialog from '../../components/ConfirmDialog'
import CategoryPicker from './CategoryPicker'
import { deleteButtonClass, Field, inputClass, numberError, primaryButtonClass } from '../../components/form'
import { formatNumber, formatRef, parseNumber, toInput } from '../../lib/format'
import { refValue } from '../../lib/points'
import { lookupFood } from '../../lib/analyzeApi'
import { friendlyError } from '../../lib/photo'
import { lookupPatch } from '../../lib/foodLookup'

// First unit of every food: fixed, never editable or deletable (spec.md §2).
const DEFAULT_UNIT = { label: '100 g', grams: 100 }
let nextKey = 1

function validate({ id, name, category, kcal, fat, units }, foods) {
  const e = {}
  const n = name.trim().toLowerCase()
  if (!n) e.name = 'Pflichtfeld'
  else if (foods.some((f) => f.id !== id && f.name.trim().toLowerCase() === n)) e.name = 'Diesen Namen gibt es schon'
  if (!category.trim()) e.category = 'Pflichtfeld'
  const kcalErr = numberError(kcal, parseNumber(kcal))
  if (kcalErr) e.kcal = kcalErr
  const fatErr = numberError(fat, parseNumber(fat))
  if (fatErr) e.fat = fatErr

  const seen = new Set([DEFAULT_UNIT.label])
  const unitErrors = {}
  for (const u of units) {
    const label = u.label.trim().toLowerCase()
    const ue = []
    if (!label) ue.push('Bezeichnung fehlt')
    else if (seen.has(label)) ue.push('Bezeichnung doppelt')
    seen.add(label)
    const g = parseNumber(u.grams)
    if (!(g > 0)) ue.push('Gramm muss größer als 0 sein')
    if (ue.length) unitErrors[u.key] = ue.join(' · ')
  }
  if (Object.keys(unitErrors).length) e.units = unitErrors
  return e
}

/**
 * Create or edit a food. onClose(savedId?) — savedId lets callers select the new food.
 * `initial` ({ kcal, fat, grams }, from Rechner) prefills a new food: kcal/fat per 100 g, and a first size of `grams` still without a name.
 */
export default function FoodForm({ food, initialName = '', initial, onClose }) {
  const { foods } = useData()
  const toast = useToast()
  const [name, setName] = useState(food?.name ?? initialName)
  const [category, setCategory] = useState(food?.category ?? '')
  const [remark, setRemark] = useState(food?.remark ?? '')
  const [kcal, setKcal] = useState(toInput(food?.kcal_100 ?? initial?.kcal))
  const [fat, setFat] = useState(toInput(food?.fat_100 ?? initial?.fat))
  const [units, setUnits] = useState(() => {
    if (!food && initial?.grams > 0) return [{ key: nextKey++, label: '', grams: toInput(initial.grams) }]
    return (food?.units ?? []).slice(1).map((u) => ({ key: nextKey++, label: u.label, grams: toInput(u.grams) }))
  })
  const [submitted, setSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // "Vorschlag suchen" (spec.md §4.9): { status: 'loading' | 'done' | 'error', searched, candidates?, message? }
  const [lookup, setLookup] = useState(null)
  const [replacing, setReplacing] = useState(null) // suggestion waiting for "Werte ersetzen?"
  const [aiFilled, setAiFilled] = useState(false)

  const categories = useMemo(
    () => [...new Set((foods ?? []).map((f) => f.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')),
    [foods],
  )
  const errors = validate({ id: food?.id, name, category, kcal, fat, units }, foods ?? [])
  const shown = submitted ? errors : {}

  const k = parseNumber(kcal)
  const f = parseNumber(fat)
  const unitPoints = (gramsText) => {
    const g = parseNumber(gramsText)
    return k >= 0 && f >= 0 && g > 0 ? formatRef((g / 100) * refValue(k, f)) : null
  }

  const search = async () => {
    const searched = name.trim()
    if (!searched || lookup?.status === 'loading') return
    if (!navigator.onLine) return setLookup({ status: 'error', searched, message: 'Keine Internetverbindung.' })
    setLookup({ status: 'loading', searched })
    try {
      const { candidates } = await lookupFood({ name: searched, categories })
      setLookup({ status: 'done', searched, candidates })
    } catch (err) {
      setLookup({ status: 'error', searched, message: friendlyError(err) })
    }
  }

  const apply = (c) => {
    const patch = lookupPatch(c, {
      name,
      searched: lookup.searched,
      category,
      units: units.filter((u) => u.label.trim() || String(u.grams).trim()),
    })
    setKcal(toInput(c.kcalPer100))
    setFat(toInput(c.fatPer100))
    if (patch.name) setName(patch.name)
    if (patch.category) setCategory(patch.category)
    if (patch.units) setUnits(patch.units.map((u) => ({ key: nextKey++, label: u.label, grams: toInput(u.grams) })))
    setAiFilled(true)
    setLookup(null)
    setReplacing(null)
  }
  const pick = (c) => (kcal.trim() || fat.trim() ? setReplacing(c) : apply(c))

  const updateUnit = (key, field, value) => setUnits((us) => us.map((u) => (u.key === key ? { ...u, [field]: value } : u)))

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    const data = {
      name: name.trim(),
      category: categories.find((c) => c.toLowerCase() === category.trim().toLowerCase()) ?? category.trim(),
      remark: remark.trim() || null,
      kcal_100: k,
      fat_100: f,
      units: [DEFAULT_UNIT, ...units.map((u) => ({ label: u.label.trim(), grams: parseNumber(u.grams) }))],
      updatedAt: serverTimestamp(),
    }
    const ref = food ? doc(db, 'foods', food.id) : doc(collection(db, 'foods'))
    persist(food ? updateDoc(ref, data) : setDoc(ref, { ...data, createdAt: serverTimestamp() }), toast)
    onClose(ref.id)
  }

  const remove = () => {
    persist(deleteDoc(doc(db, 'foods', food.id)), toast)
    onClose()
  }

  return (
    <Sheet
      title={food ? 'Lebensmittel bearbeiten' : 'Neues Lebensmittel'}
      onClose={() => onClose()}
      footer={
        <>
          <button type="button" onClick={save} className={primaryButtonClass}>
            Speichern
          </button>
          {food && (
            <button type="button" onClick={() => setConfirming(true)} className={deleteButtonClass}>
              Löschen
            </button>
          )}
        </>
      }
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Name" required error={shown.name}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass(shown.name)} />
          </Field>
        </div>
        <button
          type="button"
          onClick={search}
          disabled={!name.trim() || lookup?.status === 'loading'}
          aria-label="Nährwerte vorschlagen lassen"
          title="Nährwerte vorschlagen lassen"
          className="mt-[1.75rem] flex size-[3.0625rem] shrink-0 items-center justify-center rounded-chip border border-primary text-primary active:bg-primary-soft disabled:opacity-40"
        >
          <Sparkles size={22} />
        </button>
      </div>
      {lookup && (
        <div className="flex flex-col gap-2 rounded-card border border-border bg-bg p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-muted">
              {lookup.status === 'loading' ? `Suche Werte für „${lookup.searched}“ …` : 'Vorschläge (KI-Schätzung)'}
            </span>
            <button type="button" onClick={() => setLookup(null)} aria-label="Schließen" className="rounded-full p-1 text-muted active:bg-border">
              <X size={18} />
            </button>
          </div>
          {lookup.status === 'error' && <p className="text-accent">{lookup.message}</p>}
          {lookup.status === 'done' && lookup.candidates.length === 0 && <p className="text-muted">Dazu habe ich nichts gefunden.</p>}
          {lookup.status === 'done' &&
            lookup.candidates.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => pick(c)}
                className="flex flex-col rounded-chip border border-border bg-card px-4 py-3 text-left active:border-primary"
              >
                <span className="font-semibold">{c.name}</span>
                <span className="text-sm text-muted">
                  {formatNumber(c.kcalPer100)} kcal · {formatNumber(c.fatPer100)} g Fett pro 100 g · {formatRef(refValue(c.kcalPer100, c.fatPer100))} Pkt
                </span>
                {c.note && <span className="text-sm text-muted">{c.note}</span>}
              </button>
            ))}
        </div>
      )}
      <Field label="Kategorie" required error={shown.category}>
        <CategoryPicker value={category} onChange={setCategory} categories={categories} error={shown.category} />
      </Field>
      <Field label="Bemerkung">
        <input value={remark} onChange={(e) => setRemark(e.target.value)} className={inputClass()} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="kcal pro 100 g" required error={shown.kcal}>
          <input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} className={inputClass(shown.kcal)} />
        </Field>
        <Field label="Fett pro 100 g" required error={shown.fat}>
          <input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className={inputClass(shown.fat)} />
        </Field>
      </div>
      {aiFilled && <p className="-mt-2 text-sm text-muted">Werte aus einer KI-Schätzung – bitte prüfen.</p>}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted">Größen</span>
        {/* Same columns as the rows below: size · points · (lock instead of the bin). */}
        <div className="flex items-center gap-2">
          <span className="flex-1 rounded-chip border border-border bg-primary-soft px-4 py-3">{DEFAULT_UNIT.label}</span>
          <span className="w-10 shrink-0 text-right text-sm font-semibold text-primary tabular-nums" aria-label="Punkte">
            {unitPoints(String(DEFAULT_UNIT.grams)) ?? '–'}
          </span>
          <span className="flex w-9 shrink-0 justify-center text-muted">
            <Lock size={16} aria-label="fest" />
          </span>
        </div>
        {units.map((u) => (
          <div key={u.key} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                value={u.label}
                onChange={(e) => updateUnit(u.key, 'label', e.target.value)}
                placeholder="z. B. Becher"
                aria-label="Bezeichnung"
                className={`${inputClass(shown.units?.[u.key])} min-w-0 flex-1`}
              />
              <div className="relative w-24 shrink-0">
                <input
                  inputMode="decimal"
                  value={u.grams}
                  onChange={(e) => updateUnit(u.key, 'grams', e.target.value)}
                  placeholder="0"
                  aria-label="Gramm"
                  className={`${inputClass(shown.units?.[u.key])} pr-8`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">g</span>
              </div>
              {/* Exact points for one of this size, one decimal, not rounded to 0.5 (display only). */}
              <span className="w-10 shrink-0 text-right text-sm font-semibold text-primary tabular-nums" aria-label="Punkte">
                {unitPoints(u.grams) ?? '–'}
              </span>
              <button
                type="button"
                onClick={() => setUnits((us) => us.filter((x) => x.key !== u.key))}
                aria-label="Größe entfernen"
                className="shrink-0 rounded-full p-2 text-muted active:bg-border"
              >
                <Trash2 size={20} />
              </button>
            </div>
            {shown.units?.[u.key] && <span className="text-sm text-accent">{shown.units[u.key]}</span>}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setUnits((us) => [...us, { key: nextKey++, label: '', grams: '' }])}
          className="flex items-center gap-2 self-start rounded-chip px-1 py-2 font-semibold text-primary"
        >
          <Plus size={18} /> Größe hinzufügen
        </button>
      </div>

      {confirming && <ConfirmDialog onCancel={() => setConfirming(false)} onConfirm={remove} />}
      {replacing && (
        <ConfirmDialog
          message="kcal und Fett durch den Vorschlag ersetzen?"
          confirmLabel="Ersetzen"
          danger={false}
          onCancel={() => setReplacing(null)}
          onConfirm={() => apply(replacing)}
        />
      )}
    </Sheet>
  )
}
