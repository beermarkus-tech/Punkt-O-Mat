/** "Wirklich löschen?" confirmation, spec.md §3. */
export default function ConfirmDialog({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-card bg-card p-6 shadow-xl">
        <p className="text-lg font-semibold">Wirklich löschen?</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-chip border border-border py-3 font-semibold">
            Abbrechen
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-chip bg-accent py-3 font-semibold text-white">
            Löschen
          </button>
        </div>
      </div>
    </div>
  )
}
