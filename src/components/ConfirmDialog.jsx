/** Confirmation dialog. Default: "Wirklich löschen?" (spec.md §3); `message` / `confirmLabel` for other questions. */
export default function ConfirmDialog({ onCancel, onConfirm, message = 'Wirklich löschen?', confirmLabel = 'Löschen', danger = true }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 px-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-card bg-card p-6 shadow-xl">
        <p className="text-lg font-semibold">{message}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-chip border border-border py-3 font-semibold">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-chip py-3 font-semibold text-white ${danger ? 'bg-accent' : 'bg-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
