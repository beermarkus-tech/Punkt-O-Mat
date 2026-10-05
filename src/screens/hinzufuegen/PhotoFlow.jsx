import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Plus, RefreshCw, Replace } from 'lucide-react'
import { useData } from '../../DataContext'
import BottomSheet from '../../components/BottomSheet'
import Chip from '../../components/Chip'
import Spinner from '../../components/Spinner'
import { Field, inputClass, primaryButtonClass } from '../../components/form'
import { analyzePhoto, prepareImage } from '../../lib/analyzeApi'
import { SECTIONS, suggestSection } from '../../lib/dates'
import { formatPoints, parseNumber } from '../../lib/format'
import { buildEntries, friendlyError, itemFromFood, itemFromResult, itemPoints, knownFoodsPayload, totalPoints } from '../../lib/photo'
import FoodPicker from './FoodPicker'

const CONFIDENCE_CLASS = {
  hoch: 'bg-primary-soft text-primary',
  mittel: 'bg-border text-text',
  niedrig: 'bg-accent/15 text-accent',
}

/** One tag per row: where the numbers come from (spec.md §4.8). */
function SourceTag({ item }) {
  if (item.foodId) return <span className="rounded-chip bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">Datenbank</span>
  if (item.fromLabel) {
    // Values come from the printed nutrition table; the grams are still an estimate until the user touches the row.
    return (
      <span className="rounded-chip bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
        Etikett{item.confidence ? ' · Gramm geschätzt' : ''}
      </span>
    )
  }
  return (
    <span className={`rounded-chip px-2 py-0.5 text-xs font-semibold ${CONFIDENCE_CLASS[item.confidence] ?? 'bg-border text-muted'}`}>
      KI-Schätzung{item.confidence ? ` · ${item.confidence}` : ''}
    </span>
  )
}

/** Change name and grams, or swap the row for a real food from the Datenbank. */
function ItemSheet({ item, onSave, onSwap, onClose }) {
  const [name, setName] = useState(item.name)
  const [grams, setGrams] = useState(String(item.grams))
  const g = parseNumber(grams)
  const valid = Number.isFinite(g) && g > 0 && g <= 3000
  const save = () => {
    if (!valid || !name.trim()) return
    // Touching a row clears its confidence badge: the estimate is now the user's own (spec.md §4.8).
    onSave({ ...item, name: name.trim(), grams: Math.round(g), confidence: null })
  }
  return (
    <BottomSheet onClose={onClose} label={item.name}>
      <h2 className="mb-4 text-xl font-bold">Eintrag ändern</h2>
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!!item.foodId} className={inputClass(false)} />
        </Field>
        <Field label="Gramm" error={valid ? null : 'Bitte 1 bis 3000 g eingeben'}>
          <input inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value)} className={inputClass(!valid)} />
        </Field>
        {item.note && <p className="text-sm text-muted">{item.note}</p>}
        <button
          type="button"
          onClick={onSwap}
          className="flex items-center justify-center gap-2 rounded-chip border border-primary py-3 font-semibold text-primary active:bg-primary-soft"
        >
          <Replace size={18} /> Durch Lebensmittel aus der Datenbank ersetzen
        </button>
        <button type="button" onClick={save} className={primaryButtonClass}>
          Übernehmen
        </button>
      </div>
    </BottomSheet>
  )
}

/** Pick a food from the Datenbank, for swapping a row or adding one that was missed. */
function PickerOverlay({ title, onPick, onClose }) {
  const [query, setQuery] = useState('')
  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto bg-bg">
      <div className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 pt-4 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-chip px-3 py-2 font-semibold text-primary active:bg-border">
            Abbrechen
          </button>
        </div>
        <FoodPicker query={query} onQuery={setQuery} onPick={onPick} onCreate={() => {}} />
      </div>
    </div>
  )
}

/**
 * The "Foto" segment of the Hinzufügen panel (spec.md §4.8): capture → waiting → review.
 * Nothing is saved before the review; `onSave(entries)` receives the checked rows as log entries.
 */
export default function PhotoFlow({ onSave }) {
  const { foods } = useData()
  const foodsById = useMemo(() => new Map((foods ?? []).map((f) => [f.id, f])), [foods])
  const fileInput = useRef(null)
  const run = useRef(0) // a newer run (or Abbrechen) makes an older answer irrelevant
  const [phase, setPhase] = useState('capture') // capture | waiting | review | error
  const [hint, setHint] = useState('')
  const [photo, setPhoto] = useState(null) // { imageBase64, mimeType, previewUrl }
  const [title, setTitle] = useState('')
  const [items, setItems] = useState([])
  const [section, setSection] = useState(suggestSection)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // item key
  const [picking, setPicking] = useState(null) // { swapKey } | { add: true }

  useEffect(() => () => run.current++, [])
  useEffect(() => () => photo && URL.revokeObjectURL(photo.previewUrl), [photo])

  const fail = (message) => {
    setError(message)
    setPhase('error')
  }

  const analyze = async (p, mine = ++run.current) => {
    setPhase('waiting')
    if (!navigator.onLine) return fail('Keine Internetverbindung. Für die Foto-Analyse brauchst du Netz.')
    try {
      const result = await analyzePhoto({ imageBase64: p.imageBase64, mimeType: p.mimeType, hint, knownFoods: knownFoodsPayload(foods) })
      if (mine !== run.current) return
      if (!result.items.length) return fail('Auf dem Foto konnte ich kein Essen erkennen. Bitte nochmal versuchen, am besten von oben und bei gutem Licht.')
      setTitle(result.mealTitle)
      setItems(result.items.map((r) => itemFromResult(r, foodsById)))
      setPhase('review')
    } catch (err) {
      if (mine === run.current) fail(friendlyError(err))
    }
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // the same photo can be chosen again
    if (!file) return
    const mine = ++run.current
    setPhoto(null)
    setPhase('waiting')
    try {
      const p = await prepareImage(file)
      if (mine !== run.current) return URL.revokeObjectURL(p.previewUrl)
      setPhoto(p)
      analyze(p, mine)
    } catch {
      if (mine === run.current) fail('Das Foto konnte nicht gelesen werden. Bitte ein anderes versuchen.')
    }
  }

  const cancel = () => {
    run.current++
    setPhase('capture')
  }

  const update = (key, patch) => setItems((all) => all.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  const checkedCount = items.filter((i) => i.checked && i.grams > 0).length
  const total = totalPoints(items)

  const hiddenInput = <input ref={fileInput} type="file" onChange={onFile} className="hidden" />

  if (phase === 'capture') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary py-10 font-semibold text-primary active:bg-primary-soft"
          >
            <Camera size={40} />
            Foto aufnehmen oder auswählen
          </button>
          <Field label="Hinweis (optional)">
            <input value={hint} onChange={(e) => setHint(e.target.value)} maxLength={300} placeholder="z. B. Joghurt fettarm, halbe Portion" className={inputClass(false)} />
          </Field>
        </div>
        <p className="px-1 text-sm text-muted">Das Foto wird nur zur Analyse an Claude geschickt und nicht gespeichert.</p>
        {hiddenInput}
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="flex flex-col items-center gap-5 rounded-card border border-border bg-card p-6">
        {photo && <img src={photo.previewUrl} alt="" className="max-h-64 rounded-card object-contain" />}
        <Spinner inline />
        <p className="-mt-8 font-semibold">Claude schaut sich dein Essen an …</p>
        <button type="button" onClick={cancel} className="rounded-chip px-4 py-2 font-semibold text-muted active:bg-border">
          Abbrechen
        </button>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-5">
        <p className="text-[17px]">{error}</p>
        {photo && (
          <button type="button" onClick={() => analyze(photo)} className={`${primaryButtonClass} flex items-center justify-center gap-2`}>
            <RefreshCw size={20} /> Nochmal versuchen
          </button>
        )}
        <button type="button" onClick={cancel} className="rounded-chip py-3 font-semibold text-primary active:bg-border">
          Anderes Foto wählen
        </button>
        {hiddenInput}
      </div>
    )
  }

  // review
  const editingItem = items.find((i) => i.key === editing)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {photo && <img src={photo.previewUrl} alt="" className="size-16 shrink-0 rounded-chip object-cover" />}
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold">{title || 'Mahlzeit'}</h2>
          <p className="text-sm text-muted">Bitte prüfen – gespeichert wird erst unten.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.key} className={`flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3 ${i.checked ? '' : 'opacity-60'}`}>
            <input
              type="checkbox"
              checked={i.checked}
              onChange={(e) => update(i.key, { checked: e.target.checked })}
              aria-label={`${i.name} übernehmen`}
              className="size-6 shrink-0 accent-primary"
            />
            <button type="button" onClick={() => setEditing(i.key)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[17px] font-semibold">{i.name}</span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                {i.grams} g <SourceTag item={i} />
                {i.optional && <span className="text-xs">möglicherweise</span>}
              </span>
            </button>
            <div className="text-right">
              <div className="text-xl leading-none font-extrabold text-primary tabular-nums">{formatPoints(itemPoints(i))}</div>
              <div className="text-xs text-muted">Pkt.</div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPicking({ add: true })}
          className="flex items-center justify-center gap-2 rounded-card border border-dashed border-primary bg-card px-5 py-3.5 font-semibold text-primary"
        >
          <Plus size={20} /> Weiteres Lebensmittel
        </button>
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
        disabled={checkedCount === 0}
        onClick={() => {
          onSave(buildEntries(items, section))
          cancel() // ready for the next photo
        }}
        className={`${primaryButtonClass} disabled:opacity-40`}
      >
        Zu Heute hinzufügen · {formatPoints(total)} Pkt.
      </button>
      <button type="button" onClick={cancel} className="rounded-chip py-3 font-semibold text-muted active:bg-border">
        Verwerfen
      </button>
      {hiddenInput}

      {editingItem && (
        <ItemSheet
          key={editingItem.key}
          item={editingItem}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            update(editingItem.key, next)
            setEditing(null)
          }}
          onSwap={() => setPicking({ swapKey: editingItem.key })}
        />
      )}
      {picking && (
        <PickerOverlay
          title={picking.add ? 'Lebensmittel hinzufügen' : 'Durch Lebensmittel ersetzen'}
          onClose={() => setPicking(null)}
          onPick={(food) => {
            if (picking.add) setItems((all) => [...all, itemFromFood(food)])
            else {
              const old = items.find((i) => i.key === picking.swapKey)
              setItems((all) => all.map((i) => (i.key === picking.swapKey ? itemFromFood(food, old?.grams ?? 100, i.key) : i)))
            }
            setPicking(null)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
