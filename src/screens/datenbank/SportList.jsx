import { useData } from '../../DataContext'
import Spinner from '../../components/Spinner'
import { formatPoints } from '../../lib/format'
import { byName } from '../../lib/text'

export default function SportList({ onOpen }) {
  const { sports } = useData()
  if (!sports) return <Spinner inline />
  if (sports.length === 0) return <p className="py-8 text-center text-muted">Noch keine Sportarten</p>

  return (
    <div className="flex flex-col gap-2">
      {[...sports].sort(byName).map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s)}
          className="flex items-center gap-3 rounded-card border border-border bg-card px-5 py-4 text-left active:border-primary"
        >
          <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{s.name}</span>
          <span className="font-bold text-primary">{formatPoints(s.pointsPer30Min)} Pkt / 30 Min</span>
        </button>
      ))}
    </div>
  )
}
