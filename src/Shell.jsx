import { useState } from 'react'
import { House, Calculator, AlignJustify, Activity, Settings } from 'lucide-react'
import { DataProvider } from './DataContext'
import Datenbank from './screens/Datenbank'
import Hinzufuegen from './screens/Hinzufuegen'
import Heute from './screens/Heute'
import Gewicht from './screens/Gewicht'
import Einstellungen from './screens/Einstellungen'
import Rechner from './screens/Rechner'
import { todayId } from './lib/dates'

// Five-tab bottom navigation, spec.md §3 / §7.3. Tabs are React state, no router.
// Hinzufügen is not a tab: it opens as a panel from the "+" on Heute (or from Rechner).
const TABS = [
  { id: 'heute', label: 'Heute', Icon: House },
  { id: 'rechner', label: 'Rechner', Icon: Calculator },
  { id: 'datenbank', label: 'Datenbank', Icon: AlignJustify },
  { id: 'gewicht', label: 'Gewicht', Icon: Activity },
  { id: 'einstellungen', label: 'Einstellungen', Icon: Settings },
]

export default function Shell({ user }) {
  const [tab, setTab] = useState('heute')
  // The selected day (spec.md §3): shown by Heute, written to by Hinzufügen; resets to today on app start.
  const [date, setDate] = useState(todayId)
  // Open Hinzufügen panel: { mode, prefill } or null.
  const [adding, setAdding] = useState(null)

  return (
    <DataProvider>
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col">
      <main className="relative flex-1 px-4 pt-6 pb-28">
        {tab === 'heute' ? (
          <Heute date={date} onDateChange={setDate} onAdd={() => setAdding({ mode: 'food' })} />
        ) : tab === 'einstellungen' ? (
          <Einstellungen user={user} />
        ) : tab === 'gewicht' ? (
          <Gewicht />
        ) : tab === 'datenbank' ? (
          <Datenbank />
        ) : (
          <Rechner onAddQuick={(prefill) => setAdding({ mode: 'quick', prefill })} />
        )}
      </main>

      {adding && (
        <Hinzufuegen date={date} initialMode={adding.mode} prefill={adding.prefill} onClose={() => setAdding(null)} />
      )}

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
