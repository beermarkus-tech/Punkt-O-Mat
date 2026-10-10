import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import Chip from '../../components/Chip'
import ConfirmDialog from '../../components/ConfirmDialog'
import SegmentedControl from '../../components/SegmentedControl'
import { Field, inputClass, numberError } from '../../components/form'
import { formatNumber, formatPoints, parseNumber, toInput } from '../../lib/format'
import { lookupFood } from '../../lib/analyzeApi'
import { friendlyError } from '../../lib/photo'
import { directPoints, quickPoints, refValue } from '../../lib/points'
import { SECTIONS, suggestSection } from '../../lib/dates'

const INPUT_MODES = [
  { value: 'kcal', label: 'kcal & Fett' },
  { value: 'points', label: 'Punkte' },
]

/**
 * Free entry ("Frei", spec.md §4.2): a title plus either total kcal + total fat or the points typed in directly.
 * `initial` may hold { foodName, kcal, fat, points, section } (editing, or prefilled from Rechner);
 * an existing entry without kcal is a points entry.
 * onSubmit receives the entry fields (without id/loggedAt); kcal and fat are null for a points entry.
 * `suggest` shows the sparkle button next to the title (Nährwert-Vorschlag, spec.md §4.9): only when adding, not when editing.
 */
const round1 = (x) => Math.round(x * 10) / 10

export default function QuickEntryForm({ initial, submitText, onSubmit, children, suggest = false }) {
  const [mode, setMode] = useState(initial?.type === 'quick' && initial.kcal == null ? 'points' : 'kcal')
  const [title, setTitle] = useState(initial?.foodName ?? '')
  const [kcal, setKcal] = useState(toInput(initial?.kcal))
  const [fat, setFat] = useState(toInput(initial?.fat))
  const [pointsText, setPointsText] = useState(initial?.type === 'quick' && initial.kcal == null ? toInput(initial.points) : '')
  const [section, setSection] = useState(initial?.section ?? suggestSection())
  const [submitted, setSubmitted] = useState(false)
  // Nährwert-Vorschlag: { status, searched, candidates?, message? } and the chosen variant { c, grams }.
  const [lookup, setLookup] = useState(null)
  const [chosen, setChosen] = useState(null)
  const [replacing, setReplacing] = useState(null)
  const [aiFilled, setAiFilled] = useState(false)

  const k = parseNumber(kcal)
  const f = parseNumber(fat)
  const p = parseNumber(pointsText)
  const errors = {}
  if (!title.trim()) errors.title = 'Pflichtfeld'
  if (mode === 'kcal') {
    const kErr = numberError(kcal, k)
    if (kErr) errors.kcal = kErr
    const fErr = numberError(fat, f)
    if (fErr) errors.fat = fErr
  } else {
    const pErr = numberError(pointsText, p)
    if (pErr) errors.points = pErr
  }
  const shown = submitted ? errors : {}
  const points = mode === 'kcal' ? (k >= 0 && f >= 0 ? quickPoints({ kcal: k, fat: f }) : 0) : p >= 0 ? directPoints(p) : 0

  const search = async () => {
    const searched = title.trim()
    if (!searched || lookup?.status === 'loading') return
    if (!navigator.onLine) return setLookup({ status: 'error', searched, message: 'Keine Internetverbindung.' })
    setChosen(null)
    setLookup({ status: 'loading', searched })
    try {
      const { candidates } = await lookupFood({ name: searched, categories: [] })
      setLookup({ status: 'done', searched, candidates })
    } catch (err) {
      setLookup({ status: 'error', searched, message: friendlyError(err) })
    }
  }

  // The suggestion is per 100 g, a free entry holds totals: kcal/fat = per 100 g × grams / 100.
  const fillAmount = (c, gramsText) => {
    const g = parseNumber(gramsText)
    setChosen({ c, grams: gramsText })
    if (!(g > 0)) return
    setMode('kcal')
    setKcal(toInput(round1((c.kcalPer100 * g) / 100)))
    setFat(toInput(round1((c.fatPer100 * g) / 100)))
    setAiFilled(true)
  }
  const apply = (c) => {
    if (title.trim() === lookup.searched) setTitle(c.name)
    fillAmount(c, String(c.units[0]?.grams ?? 100))
    setReplacing(null)
  }
  const pick = (c) => ((mode === 'kcal' && (kcal.trim() || fat.trim())) || (mode === 'points' && pointsText.trim()) ? setReplacing(c) : apply(c))

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    onSubmit({
      type: 'quick',
      foodName: title.trim(),
      kcal: mode === 'kcal' ? k : null,
      fat: mode === 'kcal' ? f : null,
      section,
      points,
    })
    // Ready for the next one (the parent may also close the form).
    setTitle('')
    setKcal('')
    setFat('')
    setPointsText('')
    setSubmitted(false)
    setLookup(null)
    setChosen(null)
    setAiFilled(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Titel" required error={shown.title}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Pizza beim Italiener" className={inputClass(shown.title)} />
          </Field>
        </div>
        {suggest && (
          <button
            type="button"
            onClick={search}
            disabled={!title.trim() || lookup?.status === 'loading'}
            aria-label="Nährwerte vorschlagen lassen"
            title="Nährwerte vorschlagen lassen"
            className="mt-[1.75rem] flex size-[3.0625rem] shrink-0 items-center justify-center rounded-chip border border-primary text-primary active:bg-primary-soft disabled:opacity-40"
          >
            <Sparkles size={22} />
          </button>
        )}
      </div>

      {lookup && (
        <div className="flex flex-col gap-2 rounded-card border border-border bg-bg p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-muted">
              {lookup.status === 'loading' ? `Suche Werte für „${lookup.searched}“ …` : 'Vorschläge (KI-Schätzung)'}
            </span>
            <button
              type="button"
              onClick={() => {
                setLookup(null)
                setChosen(null)
              }}
              aria-label="Schließen"
              className="rounded-full p-1 text-muted active:bg-border"
            >
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
                className={`flex flex-col rounded-chip border bg-card px-4 py-3 text-left active:border-primary ${chosen?.c.name === c.name ? 'border-primary' : 'border-border'}`}
              >
                <span className="font-semibold">{c.name}</span>
                <span className="text-sm text-muted">
                  {formatNumber(c.kcalPer100)} kcal · {formatNumber(c.fatPer100)} g Fett pro 100 g · {formatPoints(Math.round(refValue(c.kcalPer100, c.fatPer100) * 10) / 10)} Pkt
                </span>
                {c.note && <span className="text-sm text-muted">{c.note}</span>}
              </button>
            ))}
          {chosen && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <span className="text-sm font-semibold text-muted">Menge</span>
              <div className="flex flex-wrap gap-2">
                {chosen.c.units.map((u) => (
                  <Chip key={u.label} variant="soft" className="rounded-chip" active={parseNumber(chosen.grams) === u.grams} onClick={() => fillAmount(chosen.c, String(u.grams))}>
                    {u.label} · {u.grams} g
                  </Chip>
                ))}
              </div>
              <div className="relative">
                <input
                  inputMode="decimal"
                  value={chosen.grams}
                  onChange={(e) => fillAmount(chosen.c, e.target.value)}
                  aria-label="Gramm"
                  className={`${inputClass(false)} pr-8`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">g</span>
              </div>
            </div>
          )}
        </div>
      )}

      <SegmentedControl options={INPUT_MODES} value={mode} onChange={setMode} />

      {mode === 'kcal' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="kcal gesamt" required error={shown.kcal}>
            <input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} className={inputClass(shown.kcal)} />
          </Field>
          <Field label="Fett gesamt (g)" required error={shown.fat}>
            <input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className={inputClass(shown.fat)} />
          </Field>
        </div>
      ) : (
        <Field label="Punkte" required error={shown.points}>
          <input inputMode="decimal" value={pointsText} onChange={(e) => setPointsText(e.target.value)} className={inputClass(shown.points)} />
        </Field>
      )}

      {aiFilled && mode === 'kcal' && <p className="-mt-2 text-sm text-muted">Werte aus einer KI-Schätzung – bitte prüfen.</p>}

      <div className="rounded-chip bg-primary-soft px-4 py-4 text-center">
        <div className="text-5xl leading-none font-extrabold text-primary tabular-nums">{formatPoints(points)}</div>
        <div className="mt-1 text-muted">Pkt.</div>
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
      {replacing && (
        <ConfirmDialog
          message="Eingetragene Werte durch den Vorschlag ersetzen?"
          confirmLabel="Ersetzen"
          danger={false}
          onCancel={() => setReplacing(null)}
          onConfirm={() => apply(replacing)}
        />
      )}
    </div>
  )
}
