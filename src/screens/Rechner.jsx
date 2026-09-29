import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Field, inputClass } from '../components/form'
import { formatRef, parseNumber } from '../lib/format'
import { calculatorPoints } from '../lib/points'

const round1 = (x) => Math.round(x * 10) / 10

/**
 * Points calculator (spec.md §4.7): kcal + fat (optionally per 100 g with a gram amount) → exact points,
 * one decimal. "Als freie Eingabe hinzufügen" opens the Hinzufügen panel with the totals prefilled.
 */
export default function Rechner({ onAddQuick }) {
  const [kcal, setKcal] = useState('')
  const [fat, setFat] = useState('')
  const [grams, setGrams] = useState('')

  const k = parseNumber(kcal)
  const f = parseNumber(fat)
  const g = parseNumber(grams)
  const gramsValid = grams.trim() === '' || g > 0
  const valid = k >= 0 && f >= 0 && gramsValid
  const points = valid ? calculatorPoints({ kcal: k, fat: f, grams: g > 0 ? g : 0 }) : null
  const factor = g > 0 ? g / 100 : 1

  const bad = (text, ok) => text.trim() !== '' && !ok

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold">Rechner</h1>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="kcal" error={bad(kcal, k >= 0) && 'Bitte eine Zahl ≥ 0'}>
            <input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} className={inputClass(bad(kcal, k >= 0))} />
          </Field>
          <Field label="Fett (g)" error={bad(fat, f >= 0) && 'Bitte eine Zahl ≥ 0'}>
            <input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className={inputClass(bad(fat, f >= 0))} />
          </Field>
        </div>
        <Field label="Gramm (optional)" error={bad(grams, g > 0) && 'Bitte eine Zahl > 0'}>
          <input
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="leer = Werte gelten so; sonst pro 100 g"
            className={inputClass(bad(grams, g > 0))}
          />
        </Field>

        <div className="rounded-chip bg-primary-soft px-4 py-5 text-center">
          <div className="text-6xl leading-none font-extrabold text-primary tabular-nums">
            {points == null ? '–' : formatRef(points)}
          </div>
          <div className="mt-1 text-muted">Punkte{g > 0 ? ` für ${grams.trim()} g` : ''}</div>
        </div>
      </div>

      <button
        type="button"
        disabled={points == null}
        onClick={() => onAddQuick({ kcal: round1(k * factor), fat: round1(f * factor) })}
        className="flex items-center justify-center gap-2 rounded-chip border-2 border-primary bg-card py-3.5 font-semibold text-primary active:bg-primary-soft disabled:opacity-40"
      >
        <Plus size={20} /> Als freie Eingabe hinzufügen
      </button>
    </div>
  )
}
