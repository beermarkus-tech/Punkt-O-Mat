import { doc, writeBatch } from 'firebase/firestore'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { db } from '../../firebase'
import { useData } from '../../DataContext'
import { useToast } from '../../components/ToastContext'
import { persist } from '../../data'
import Spinner from '../../components/Spinner'
import { formatNumber } from '../../lib/format'
import { trackerColor, trackerIcon } from '../../trackerStyle'

export default function TrackerList({ onOpen }) {
  const { trackers } = useData()
  const toast = useToast()
  if (!trackers) return <Spinner inline />
  if (trackers.length === 0) return <p className="py-8 text-center text-muted">Noch keine Tracker</p>

  const sorted = [...trackers].sort((a, b) => a.order - b.order)

  // Swap with the neighbour, then renumber 1..n so the order stays clean.
  const move = (i, dir) => {
    const next = [...sorted]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    const batch = writeBatch(db)
    next.forEach((t, idx) => {
      if (t.order !== idx + 1) batch.update(doc(db, 'trackers', t.id), { order: idx + 1 })
    })
    persist(batch.commit(), toast)
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((t, i) => {
        const Icon = trackerIcon(t.icon)
        const color = trackerColor(t.color)
        return (
          <div key={t.id} className="flex items-center gap-1 rounded-card border border-border bg-card py-2 pr-2 pl-4">
            <button type="button" onClick={() => onOpen(t)} className="flex min-w-0 flex-1 items-center gap-3 py-1.5 text-left">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${color}1f`, color }}
              >
                <Icon size={22} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[17px] font-semibold">{t.name}</span>
                <span className="block truncate text-sm text-muted">
                  Ziel {formatNumber(t.dailyTarget)} {t.unit} · Schritt {formatNumber(t.step)}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Nach oben"
              className="rounded-full p-2 text-muted active:bg-border disabled:opacity-25"
            >
              <ChevronUp size={22} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === sorted.length - 1}
              aria-label="Nach unten"
              className="rounded-full p-2 text-muted active:bg-border disabled:opacity-25"
            >
              <ChevronDown size={22} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
