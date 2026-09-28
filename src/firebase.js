import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// Public identifiers, not secrets — access is enforced by the Firestore rules (spec.md §6).
const firebaseConfig = {
  apiKey: 'AIzaSyD_-mALger3hU2_hsu1lA_nEMsBD0epSOo',
  authDomain: 'exercise-tracker-26120.firebaseapp.com',
  projectId: 'exercise-tracker-26120',
  storageBucket: 'exercise-tracker-26120.firebasestorage.app',
  messagingSenderId: '372462449667',
  appId: '1:372462449667:web:17679218093c73f52e0a36',
}

// The Firebase project is shared with other apps; Punkt-o-Mat uses its own named database (spec.md §2, §5).
const DATABASE_ID = 'punkt-o-mat'

// Only this Google account may use the app (spec.md §6).
export const ALLOWED_EMAIL = 'beer.markus@gmail.com'

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = initializeFirestore(
  app,
  { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
  DATABASE_ID,
)

export const isAllowed = (user) =>
  !!user && user.emailVerified && user.email === ALLOWED_EMAIL
