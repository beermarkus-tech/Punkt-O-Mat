import { arrayRemove, arrayUnion, doc, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { updateLog } from './log'
import { foodPoints, quickPoints } from './points'

// Photo analysis (spec.md §4.8): pure helpers for the review step. The app computes all points, never Claude.

export const CONFIDENCE_LABEL = { hoch: 'hoch', mittel: 'mittel', niedrig: 'niedrig' }

/** The Datenbank as the compact list the Cloud Function expects. */
export const knownFoodsPayload = (foods) => (foods ?? []).map((f) => ({ id: f.id, name: f.name }))

let counter = 0
/** A review row from a Cloud Function item. Optional items (hidden fat) start unchecked. */
export function itemFromResult(r, foodsById) {
  const food = r.matchedFoodId ? foodsById.get(r.matchedFoodId) : null
  return {
    key: `i${++counter}`,
    name: food?.name ?? r.name,
    foodId: food ? food.id : null,
    grams: r.grams,
    kcal100: food ? food.kcal_100 : r.kcalPer100,
    fat100: food ? food.fat_100 : r.fatPer100,
    confidence: r.confidence,
    note: r.note,
    optional: r.optional,
    checked: !r.optional,
  }
}

/** A row for a food picked from the Datenbank (manually added or swapped in). */
export function itemFromFood(food, grams = 100, key = `i${++counter}`) {
  return { key, name: food.name, foodId: food.id, grams, kcal100: food.kcal_100, fat100: food.fat_100, confidence: null, note: '', optional: false, checked: true }
}

const round1 = (x) => Math.round(x * 10) / 10

/** Totals of an unmatched estimate: kcal and fat for the whole portion, one decimal (as a free entry stores them). */
export function estimateTotals(item) {
  return { kcal: round1((item.grams * item.kcal100) / 100), fat: round1((item.grams * item.fat100) / 100) }
}

/** Points of one row, rounded once (spec.md §1.1). Matched = like a food in grams; unmatched = like a free entry. */
export function itemPoints(item) {
  if (item.foodId) return foodPoints({ qty: item.grams, unitGrams: 1, kcal_100: item.kcal100, fat_100: item.fat100 })
  return quickPoints(estimateTotals(item))
}

export const totalPoints = (items) => items.filter((i) => i.checked).reduce((sum, i) => sum + itemPoints(i), 0)

/** Log entries (without id/loggedAt) for the checked rows. */
export function buildEntries(items, section) {
  return items
    .filter((i) => i.checked && i.grams > 0)
    .map((i) =>
      i.foodId
        ? {
            section,
            foodId: i.foodId,
            foodName: i.name,
            kcal_100: i.kcal100,
            fat_100: i.fat100,
            unitLabel: 'g',
            unitGrams: 1,
            qty: i.grams,
            points: itemPoints(i),
            source: 'photo',
          }
        : { type: 'quick', section, foodName: i.name, ...estimateTotals(i), points: itemPoints(i), source: 'photo' },
    )
}

/** Save a whole meal in one write. Returns the stored entries, so the toast can offer "Rückgängig". */
export function addMeal({ date, log, settings, entries }) {
  const stored = entries.map((e) => ({ ...e, id: crypto.randomUUID(), loggedAt: Timestamp.now() }))
  // arrayUnion with several values keeps this a single atomic write.
  const promise = updateLog({ date, log, settings, data: { entries: arrayUnion(...stored) } })
  return { stored, promise }
}

export const undoMeal = ({ date, stored }) => updateDoc(doc(db, 'dailyLogs', date), { entries: arrayRemove(...stored) })

/** German message for a failed call to the Cloud Function. */
export function friendlyError(err) {
  const code = String(err?.code ?? '').replace('functions/', '')
  const server = ['permission-denied', 'resource-exhausted', 'failed-precondition', 'invalid-argument', 'unauthenticated', 'unavailable']
  if (server.includes(code) && err.message && !/^(unavailable|internal)$/i.test(err.message)) return err.message
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Keine Verbindung zur KI. Bitte nochmal versuchen.'
  return 'Analyse fehlgeschlagen. Bitte nochmal versuchen.'
}
