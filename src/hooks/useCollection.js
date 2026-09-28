import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

/** Live list of all documents in a top-level collection; null while loading. */
export function useCollection(name) {
  const [items, setItems] = useState(null)
  useEffect(
    () =>
      onSnapshot(
        collection(db, name),
        (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error(err)
          setItems([])
        },
      ),
    [name],
  )
  return items
}
