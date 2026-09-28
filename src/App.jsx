import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isAllowed } from './firebase'
import { seedIfNeeded } from './seed'
import Spinner from './components/Spinner'
import { ToastProvider, useToast } from './components/ToastContext'
import Anmeldung from './screens/Anmeldung'
import KeinZugriff from './screens/KeinZugriff'
import Shell from './Shell'

function Root() {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const toast = useToast()

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!isAllowed(user)) return
    seedIfNeeded().catch((err) => {
      console.error(err)
      toast('Speichern fehlgeschlagen')
    })
  }, [user, toast])

  if (user === undefined) return <Spinner />
  if (!user) return <Anmeldung />
  if (!isAllowed(user)) return <KeinZugriff user={user} />
  return <Shell user={user} />
}

export default function App() {
  return (
    <ToastProvider>
      <Root />
    </ToastProvider>
  )
}
