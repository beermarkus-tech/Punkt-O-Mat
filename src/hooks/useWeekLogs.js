import { useEffect, useState } from 'react'
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

/** Live dailyLogs of one week, keyed by date ID. undefined while loading. */
export function useWeekLogs(dates) {
  const [state, setState] = useState({ key: null, logs: undefined })
  const first = dates[0]
  const last = dates[dates.length - 1]
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
