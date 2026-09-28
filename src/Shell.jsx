import { useState } from 'react'
import { House, Plus, AlignJustify, Activity, Settings } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'

// Five-tab bottom navigation, spec.md §3 / §7.3. Tabs are React state, no router.
const TABS = [
  { id: 'heute', label: 'Heute', Icon: House },
  { id: 'hinzufuegen', label: 'Hinzufügen', Icon: Plus },
  { id: 'datenbank', label: 'Datenbank', Icon: AlignJustify },
  { id: 'gewicht', label: 'Gewicht', Icon: Activity },
  { id: 'einstellungen', label: 'Einstellungen', Icon: Settings },
]

export default function Shell({ user }) {
  const [tab, setTab] = useState('heute')
  const current = TABS.find((t) => t.id === tab)

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col">
      <main className="flex-1 px-4 pt-6 pb-28">
        <h1 className="text-2xl font-bold">{current.label}</h1>
        {/* Placeholder until the screen is built in its PLAN.md phase. */}
        {tab === 'einstellungen' ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-muted">{user.displayName} · {user.email}</p>
            <button
              onClick={() => signOut(auth)}
              className="rounded-chip border border-border bg-card px-6 py-4 font-semibold text-accent active:opacity-80"
            >
              Abmelden
            </button>
          </div>
        ) : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-[480px]">
          {TABS.map(({ id, label, Icon }) => {
            const active = id === tab
            return (
              <li key={id} className="flex-1">
                <button
                  onClick={() => setTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full flex-col items-center gap-1 py-2 text-[11px] ${active ? 'font-semibold text-primary' : 'text-muted'}`}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
