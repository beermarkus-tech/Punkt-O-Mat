import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

/** All days with a weight: [{ date, weight }]. undefined while loading (spec.md §4.4). */
export function useWeights() {
  const [points, setPoints] = useState(undefined)
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'dailyLogs'), where('weight', '!=', null)),
        (snap) => setPoints(snap.docs.map((d) => ({ date: d.id, weight: d.data().weight }))),
        (err) => {
          console.error(err)
          setPoints([])
        },
      ),
    [],
  )
  return points
}
