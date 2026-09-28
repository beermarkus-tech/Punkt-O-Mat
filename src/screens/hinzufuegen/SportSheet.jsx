import { useState } from 'react'
import BottomSheet from '../../components/BottomSheet'
import Stepper from '../../components/Stepper'
import { formatPoints } from '../../lib/format'
import { sportPoints } from '../../lib/points'

/** Minutes for a sport session (spec.md §4.2). onSubmit receives the sport entry fields. */
export default function SportSheet({ sport, initialMinutes = 30, submitText, onSubmit, onClose, children }) {
  const [minutes, setMinutes] = useState(initialMinutes)
  const points = sportPoints({ minutes, pointsPer30Min: sport.pointsPer30Min })

  return (
    <BottomSheet onClose={onClose} label={sport.name}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{sport.name}</h2>
          <p className="text-muted">{formatPoints(sport.pointsPer30Min)} Pkt / 30 Min</p>
        </div>
        <div className="text-right">
          <div className="text-4xl leading-none font-extrabold text-primary tabular-nums">+{formatPoints(points)}</div>
          <div className="text-sm text-muted">Pkt.</div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <h3 className="text-xs font-bold tracking-wider text-muted uppercase">Minuten</h3>
        <Stepper value={minutes} onChange={setMinutes} step={5} min={5} suffix=" Min" />
      </div>

      <button
        type="button"
        onClick={() =>
          onSubmit({ sportName: sport.name, pointsPer30Min: sport.pointsPer30Min, minutes, points })
        }
        className="mt-6 w-full rounded-chip bg-primary py-4 text-lg font-semibold text-white active:opacity-80"
      >
        {submitText} · +{formatPoints(points)} Pkt.
      </button>
      {children}
    </BottomSheet>
  )
}
