import { useMemo, useState } from 'react'
import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { Plus, Trash2 } from 'lucide-react'
import { db } from '../../firebase'
import { useData } from '../../DataContext'
import { useToast } from '../../components/ToastContext'
import { persist } from '../../data'
import Sheet from '../../components/Sheet'
import Stepper from '../../components/Stepper'
import ConfirmDialog from '../../components/ConfirmDialog'
import { deleteButtonClass, Field, inputClass, primaryButtonClass } from '../../components/form'
import { formatNumber, formatPoints } from '../../lib/format'
import { foodPoints, roundHalf } from '../../lib/points'
import { entryLabel } from '../../lib/entries'
import { recipeTotals, resolveIngredient } from '../../lib/recipes'
import FoodSheet from '../hinzufuegen/FoodSheet'
import CategoryPicker from './CategoryPicker'
import IngredientPicker from './IngredientPicker'

let nextKey = 1
const withKey = (ing) => ({ ...ing, key: nextKey++ })

/** The food shown in the amount sheet: current food if it still exists, else the ingredient's snapshot. */
function sheetFood(ing, food) {
  if (food) return food
  return {
    name: ing.foodName,
    category: '',
    kcal_100: ing.kcal_100,
    fat_100: ing.fat_100,
    units: ing.unitLabel === 'g' ? [{ label: '100 g', grams: 100 }] : [{ label: '100 g', grams: 100 }, { label: ing.unitLabel, grams: ing.unitGrams }],
  }
}

/** Create or edit a recipe (spec.md §4.6). */
export default function RecipeForm({ recipe, onClose }) {
  const { foods } = useData()
  const toast = useToast()
  const [name, setName] = useState(recipe?.name ?? '')
  const [category, setCategory] = useState(recipe?.category ?? '')
  const [remark, setRemark] = useState(recipe?.remark ?? '')
  const [servings, setServings] = useState(recipe?.servings ?? 1)
  const [ingredients, setIngredients] = useState(() => (recipe?.ingredients ?? []).map(withKey))
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState(null) // { key | null, food, initial }
  const [submitted, setSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const foodsById = useMemo(() => new Map((foods ?? []).map((f) => [f.id, f])), [foods])
  const categories = useMemo(
    () => [...new Set((foods ?? []).map((f) => f.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')),
    [foods],
  )
  const resolved = ingredients.map((i) => ({ ...resolveIngredient(i, foodsById), key: i.key }))
  const totals = recipeTotals(ingredients, foodsById)
  const totalPoints = roundHalf(totals.fat / 9 + totals.kcal / 60)
  const portionPoints = roundHalf((totals.fat / 9 + totals.kcal / 60) / servings)

  const errors = {}
  const n = name.trim().toLowerCase()
  if (!n) errors.name = 'Pflichtfeld'
  else if ((foods ?? []).some((f) => f.id !== recipe?.id && f.name.trim().toLowerCase() === n)) errors.name = 'Diesen Namen gibt es schon'
  if (!category.trim()) errors.category = 'Pflichtfeld'
  if (!ingredients.length) errors.ingredients = 'Mindestens eine Zutat hinzufügen'
  const shown = submitted ? errors : {}

  const saveIngredient = (fields) => {
    const ing = {
      foodId: editing.food.id ?? editing.foodId,
      foodName: fields.foodName,
      kcal_100: fields.kcal_100,
      fat_100: fields.fat_100,
      unitLabel: fields.unitLabel,
      unitGrams: fields.unitGrams,
      qty: fields.qty,
    }
    setIngredients((list) =>
      editing.key == null ? [...list, withKey(ing)] : list.map((i) => (i.key === editing.key ? { ...ing, key: i.key } : i)),
    )
    setEditing(null)
  }

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) return
    const data = {
      type: 'recipe',
      name: name.trim(),
      category: categories.find((c) => c.toLowerCase() === category.trim().toLowerCase()) ?? category.trim(),
      remark: remark.trim() || null,
      servings,
      // Store the current ingredient values as the snapshot (fallback if a food is deleted later).
      ingredients: resolved.map((i) => ({
        foodId: i.foodId,
        foodName: i.foodName,
        kcal_100: i.kcal_100,
        fat_100: i.fat_100,
        unitLabel: i.unitLabel,
        unitGrams: i.unitGrams,
        qty: i.qty,
      })),
      updatedAt: serverTimestamp(),
    }
    const ref = recipe ? doc(db, 'foods', recipe.id) : doc(collection(db, 'foods'))
    persist(recipe ? updateDoc(ref, data) : setDoc(ref, { ...data, createdAt: serverTimestamp() }), toast)
    onClose(ref.id)
  }

  const remove = () => {
    persist(deleteDoc(doc(db, 'foods', recipe.id)), toast)
    onClose()
  }

  return (
    <Sheet
      title={recipe ? 'Rezept bearbeiten' : 'Neues Rezept'}
      onClose={() => onClose()}
      footer={
        <>
          <button type="button" onClick={save} className={primaryButtonClass}>
            Speichern
          </button>
          {recipe && (
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
      <Field label="Kategorie" required error={shown.category}>
        <CategoryPicker value={category} onChange={setCategory} categories={categories} error={shown.category} />
      </Field>
      <Field label="Bemerkung">
        <input value={remark} onChange={(e) => setRemark(e.target.value)} className={inputClass()} />
      </Field>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-muted">Ergibt Portionen</span>
        <Stepper value={servings} onChange={setServings} step={1} min={1} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted">Zutaten *</span>
        {resolved.length > 0 && (
          <div className="overflow-hidden rounded-chip border border-border bg-card">
            {resolved.map((i) => (
              <div key={i.key} className="flex items-center gap-1 border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      key: i.key,
                      foodId: i.foodId,
                      food: sheetFood(i, foodsById.get(i.foodId)),
                      initial: { unitLabel: i.unitLabel, qty: i.qty },
                    })
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left active:bg-bg"
                >
                  <span className="min-w-0 flex-1">{entryLabel(i)}</span>
                  <span className="tabular-nums">{formatPoints(foodPoints(i))}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIngredients((list) => list.filter((x) => x.key !== i.key))}
                  aria-label="Zutat entfernen"
                  className="shrink-0 rounded-full p-2.5 text-muted active:bg-border"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        {shown.ingredients && <span className="text-sm text-accent">{shown.ingredients}</span>}
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex items-center gap-2 self-start rounded-chip px-1 py-2 font-semibold text-primary"
        >
          <Plus size={18} /> Zutat hinzufügen
        </button>
        {ingredients.length > 0 && (
          <div className="rounded-chip bg-primary-soft px-4 py-3 text-primary">
            <div className="flex justify-between font-semibold">
              <span>Gesamt {formatNumber(Math.round(totals.grams))} g</span>
              <span>{formatPoints(totalPoints)} Pkt.</span>
            </div>
            {servings > 1 && (
              <div className="mt-0.5 flex justify-between text-sm">
                <span>1 Portion ({formatNumber(Math.round(totals.grams / servings))} g)</span>
                <span>{formatPoints(portionPoints)} Pkt.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {picking && (
        <IngredientPicker
          onClose={() => setPicking(false)}
          onPick={(food) => {
            setPicking(false)
            setEditing({ key: null, foodId: food.id, food, initial: null })
          }}
        />
      )}
      {editing && (
        <FoodSheet
          key={editing.key ?? `new-${editing.foodId}`}
          food={editing.food}
          initial={editing.initial}
          showSection={false}
          submitText="Übernehmen"
          onSubmit={saveIngredient}
          onClose={() => setEditing(null)}
        />
      )}
      {confirming && <ConfirmDialog onCancel={() => setConfirming(false)} onConfirm={remove} />}
    </Sheet>
  )
}
