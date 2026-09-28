import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import AppIcon from '../components/AppIcon'

export default function Anmeldung() {
  const [error, setError] = useState(null)

  const signIn = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error(err)
        setError('Anmeldung fehlgeschlagen')
      }
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-8 px-6">
      <AppIcon size={112} />
      <h1 className="text-3xl font-bold text-primary">Punkt-o-Mat</h1>
      <button
        onClick={signIn}
        className="w-full rounded-chip bg-primary px-6 py-4 text-lg font-semibold text-white active:opacity-80"
      >
        Mit Google anmelden
      </button>
      {error && <p className="text-accent">{error}</p>}
    </div>
  )
}
