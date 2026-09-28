import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isAllowed } from './firebase'
import { seedIfNeeded } from './seed'
import Spinner from './components/Spinner'
import Toast from './components/Toast'
import Anmeldung from './screens/Anmeldung'
import KeinZugriff from './screens/KeinZugriff'
import Shell from './Shell'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const [toast, setToast] = useState(null)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!isAllowed(user)) return
    seedIfNeeded().catch((err) => {
      console.error(err)
      // Temporary during Phase 0 setup: show the error code to help diagnose Firebase config issues.
      setToast(`Speichern fehlgeschlagen (${err.code ?? err.message})`)
    })
  }, [user])

  let content
  if (user === undefined) content = <Spinner />
  else if (!user) content = <Anmeldung />
  else if (!isAllowed(user)) content = <KeinZugriff user={user} />
  else content = <Shell user={user} />

  return (
    <>
      {content}
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  )
}
