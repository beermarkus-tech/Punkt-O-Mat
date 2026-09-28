import { useEffect, useState } from 'react'
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

/** Live dailyLogs from `first` to `last` (day IDs, inclusive), keyed by date ID. undefined while loading. */
export function useLogsRange(first, last) {
  const [state, setState] = useState({ key: null, logs: undefined })
  const key = `${first}..${last}`

  useEffect(() => {
    const q = query(collection(db, 'dailyLogs'), where(documentId(), '>=', first), where(documentId(), '<=', last))
    return onSnapshot(
      q,
      (snap) => setState({ key, logs: Object.fromEntries(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }])) }),
      (err) => {
        console.error(err)
        setState({ key, logs: {} })
      },
    )
  }, [first, last, key])

  return state.key === key ? state.logs : undefined
}

/** Live dailyLogs of one week (the 7 day IDs), keyed by date ID. undefined while loading. */
export function useWeekLogs(dates) {
  return useLogsRange(dates[0], dates[dates.length - 1])
}
