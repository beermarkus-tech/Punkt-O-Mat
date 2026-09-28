import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function KeinZugriff({ user }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-bold">Kein Zugriff</h1>
      <p className="text-muted">{user.email}</p>
      <button
        onClick={() => signOut(auth)}
        className="w-full rounded-chip border border-border bg-card px-6 py-4 text-lg font-semibold text-accent active:opacity-80"
      >
        Abmelden
      </button>
    </div>
  )
}
