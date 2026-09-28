import { arrayUnion, doc, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Merge `data` into dailyLogs/{date}. `log` is the current day doc: null = doesn't exist yet,
 * so the settings snapshot is copied in on this first write (spec.md §2).
 */
export function updateLog({ date, log, settings, data }) {
  const full = { ...data }
  if (log === null) {
    full.dailyAllowance = settings?.dailyAllowance ?? 30
    full.weeklyBonus = settings?.weeklyBonus ?? 20
  }
  return setDoc(doc(db, 'dailyLogs', date), full, { merge: true })
}

/** Append a food entry (field "entries") or sport session (field "sport"). */
export function addToLog({ date, log, settings, field, item }) {
  const entry = { ...item, id: crypto.randomUUID(), loggedAt: Timestamp.now() }
  return updateLog({ date, log, settings, data: { [field]: arrayUnion(entry) } })
}

/** Replace one entry (matched by id) in an existing day doc. */
export function replaceInLog({ date, log, field, item }) {
  return updateDoc(doc(db, 'dailyLogs', date), {
    [field]: (log?.[field] ?? []).map((e) => (e.id === item.id ? item : e)),
  })
}

export function removeFromLog({ date, log, field, id }) {
  return updateDoc(doc(db, 'dailyLogs', date), { [field]: (log?.[field] ?? []).filter((e) => e.id !== id) })
}
