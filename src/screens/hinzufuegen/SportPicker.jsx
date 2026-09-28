import { ChevronRight } from 'lucide-react'
import { useData } from '../../DataContext'
import Spinner from '../../components/Spinner'
import { formatPoints } from '../../lib/format'
import { byName } from '../../lib/text'

export default function SportPicker({ onPick }) {
  const { sports } = useData()
  if (!sports) return <Spinner inline />
  if (sports.length === 0) return <p className="py-8 text-center text-muted">Noch keine Sportarten – in der Datenbank anlegen</p>

  return (
    <div className="flex flex-col gap-2">
      {[...sports].sort(byName).map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          className="flex items-center gap-3 rounded-card border border-border bg-card px-5 py-4 text-left active:border-primary"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-semibold">{s.name}</span>
            <span className="block text-sm text-muted">{formatPoints(s.pointsPer30Min)} Pkt / 30 Min</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-muted" />
        </button>
      ))}
    </div>
  )
}
