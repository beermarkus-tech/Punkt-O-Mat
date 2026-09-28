/** Panel sliding up from the bottom over a dimmed screen; tap outside to close. */
export default function BottomSheet({ onClose, children, label }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-card px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        {children}
      </div>
    </div>
  )
}
