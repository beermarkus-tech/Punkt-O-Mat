import { collection, doc, getDoc, getDocs, limit, query, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// First-launch defaults, spec.md §2.
export async function seedIfNeeded() {
  const configRef = doc(db, 'settings', 'config')
  if (!(await getDoc(configRef)).exists()) {
    await setDoc(configRef, { dailyAllowance: 30, weeklyBonus: 20 })
  }

  const trackers = await getDocs(query(collection(db, 'trackers'), limit(1)))
  if (trackers.empty) {
    await setDoc(doc(db, 'trackers', 'wasser'), {
      name: 'Wasser', unit: 'Gläser', dailyTarget: 6, step: 1, icon: 'droplet', color: 'green', order: 1,
    })
    await setDoc(doc(db, 'trackers', 'obst-gemuese'), {
      name: 'Obst & Gemüse', unit: 'Portionen', dailyTarget: 5, step: 1, icon: 'apple', color: 'orange', order: 2,
    })
  }
}
