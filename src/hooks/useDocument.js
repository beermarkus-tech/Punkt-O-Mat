import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

/** Live single document: undefined while loading, null if it doesn't exist. */
export function useDocument(path, id) {
  const [state, setState] = useState({ key: null, data: undefined })
  const key = `${path}/${id}`
  useEffect(
    () =>
      onSnapshot(
        doc(db, path, id),
        (snap) => setState({ key, data: snap.exists() ? { id: snap.id, ...snap.data() } : null }),
        (err) => {
          console.error(err)
          setState({ key, data: null })
        },
      ),
    [path, id, key],
  )
  // Don't show the previous document's data while a new id loads.
  return state.key === key ? state.data : undefined
}
