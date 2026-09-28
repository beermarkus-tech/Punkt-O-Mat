/* global __APP_VERSION__, __BUILD__ */
import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useData } from '../DataContext'
import { useDocument } from '../hooks/useDocument'
import { useToast } from '../components/ToastContext'
import BottomSheet from '../components/BottomSheet'
import { inputClass, primaryButtonClass } from '../components/form'
import { persist } from '../data'
import { todayId } from '../lib/dates'

const SETTINGS = [
  { key: 'dailyAllowance', label: 'Tägliche Punkte', fallback: 30 },
  { key: 'weeklyBonus', label: 'Wochenbonus', fallback: 20 },
]

const sectionTitle = 'mb-2 px-1 text-sm font-bold tracking-wide text-muted uppercase'
const card = 'overflow-hidden rounded-card border border-border bg-card'

/** Integer input 1–100 (spec.md §4.5). */
function NumberSheet({ title, initial, onSave, onClose }) {
  const [text, setText] = useState(String(initial))
  const [error, setError] = useState(null)
  const save = () => {
    const n = Number(text.trim())
    if (!Number.isInteger(n) || n < 1 || n > 100) return setError('Bitte eine ganze Zahl von 1 bis 100 eingeben')
    onSave(n)
  }
  return (
    <BottomSheet onClose={onClose} label={title}>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <input
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        aria-label={title}
        autoFocus
        className={`${inputClass(error)} text-2xl`}
      />
      {error && <p className="mt-1.5 text-sm text-accent">{error}</p>}
      <p className="mt-3 text-sm text-muted">Gilt ab heute. Vergangene Tage behalten ihren Wert.</p>
      <button type="button" onClick={save} className={`${primaryButtonClass} mt-6`}>
        Speichern
      </button>
    </BottomSheet>
  )
}

function initials(name, email) {
  const parts = (name || email || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function Avatar({ user }) {
  const [broken, setBroken] = useState(false)
  if (user.photoURL && !broken) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="size-14 shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
      {initials(user.displayName, user.email)}
    </span>
  )
}

export default function Einstellungen({ user }) {
  const { settings } = useData()
  const toast = useToast()
  const today = todayId()
  const todayLog = useDocument('dailyLogs', today)
  const [editing, setEditing] = useState(null) // one of SETTINGS

  // Settings apply to today and the future: update settings/config and today's snapshot if it exists (spec.md §2).
  const save = (key, value) => {
    persist(setDoc(doc(db, 'settings', 'config'), { [key]: value }, { merge: true }), toast)
    if (todayLog) persist(updateDoc(doc(db, 'dailyLogs', today), { [key]: value }), toast)
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-extrabold">Einstellungen</h1>

      <section>
        <h2 className={sectionTitle}>Punktebudget</h2>
        <div className={card}>
          {SETTINGS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setEditing(s)}
              className={`flex w-full items-center gap-3 px-5 py-4 text-left active:bg-bg ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <span className="flex-1 text-[17px]">{s.label}</span>
              <span className="rounded-chip bg-primary-soft px-3 py-1 text-lg font-bold text-primary tabular-nums">
                {settings?.[s.key] ?? s.fallback}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Konto</h2>
        <div className={`${card} flex items-center gap-4 px-5 py-4`}>
          <Avatar user={user} />
          <div className="min-w-0">
            <div className="truncate text-lg font-bold">{user.displayName || user.email}</div>
            <div className="truncate text-sm text-muted">Google-Konto verbunden</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Über</h2>
        <div className={`${card} flex items-center px-5 py-4`}>
          <span className="flex-1 text-[17px]">Punkt-o-Mat</span>
          <span className="text-muted tabular-nums">
            v{__APP_VERSION__} · Build {__BUILD__}
          </span>
        </div>
      </section>

      <button type="button" onClick={() => signOut(auth)} className={`${card} py-4 text-lg font-bold text-accent active:bg-bg`}>
        Abmelden
      </button>

      {editing && (
        <NumberSheet
          key={editing.key}
          title={editing.label}
          initial={settings?.[editing.key] ?? editing.fallback}
          onClose={() => setEditing(null)}
          onSave={(value) => save(editing.key, value)}
        />
      )}
    </div>
  )
}
