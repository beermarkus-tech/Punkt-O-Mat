import { X } from 'lucide-react'

/** Full-screen form panel over the current tab. */
export default function Sheet({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-4 pb-8">
        <div className="mb-4 flex items-center gap-1">
          <button type="button" onClick={onClose} aria-label="Schließen" className="-ml-2 rounded-full p-2 active:bg-border">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="flex flex-1 flex-col gap-5">{children}</div>
        <div className="mt-8 flex flex-col gap-3">{footer}</div>
      </div>
    </div>
  )
}
