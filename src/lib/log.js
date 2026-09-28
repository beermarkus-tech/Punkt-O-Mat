import { arrayUnion, doc, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Append a food entry (field "entries") or sport session (field "sport") to dailyLogs/{date}.
 * `log` is the current day doc: null = doesn't exist yet, so the settings snapshot is copied in (spec.md §2).
 */
export function addToLog({ date, log, settings, field, item }) {
  const data = { [field]: arrayUnion({ ...item, id: crypto.randomUUID(), loggedAt: Timestamp.now() }) }
  if (log === null) {
    data.dailyAllowance = settings?.dailyAllowance ?? 30
    data.weeklyBonus = settings?.weeklyBonus ?? 20
  }
  return setDoc(doc(db, 'dailyLogs', date), data, { merge: true })
}

export function removeFromLog({ date, log, field, id }) {
  return updateDoc(doc(db, 'dailyLogs', date), { [field]: (log?.[field] ?? []).filter((e) => e.id !== id) })
}
