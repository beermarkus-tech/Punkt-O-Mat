import { useState } from 'react'
import { House, Plus, AlignJustify, Activity, Settings } from 'lucide-react'
import { DataProvider } from './DataContext'
import Datenbank from './screens/Datenbank'
import Hinzufuegen from './screens/Hinzufuegen'
import Heute from './screens/Heute'
import Gewicht from './screens/Gewicht'
import Einstellungen from './screens/Einstellungen'
import { todayId } from './lib/dates'
import BuildTag from './components/BuildTag'

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
  // The selected day (spec.md §3): shown by Heute, written to by Hinzufügen; resets to today on app start.
  const [date, setDate] = useState(todayId)
  const current = TABS.find((t) => t.id === tab)

  return (
    <DataProvider>
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col">
      <main className="relative flex-1 px-4 pt-6 pb-28">
        <BuildTag className="absolute top-1.5 right-4" />
        {tab === 'heute' ? (
          <Heute date={date} onDateChange={setDate} />
        ) : tab === 'einstellungen' ? (
          <Einstellungen user={user} />
        ) : tab === 'gewicht' ? (
          <Gewicht />
        ) : tab === 'datenbank' ? (
          <Datenbank />
        ) : tab === 'hinzufuegen' ? (
          <Hinzufuegen date={date} />
        ) : (
          <>
            <h1 className="text-3xl font-extrabold">{current.label}</h1>
            {/* Placeholder until the screen is built in its PLAN.md phase. */}
          </>
        )}
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
    </DataProvider>
  )
}
