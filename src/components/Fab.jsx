import { Plus } from 'lucide-react'

/** Floating "+" button, kept inside the centered 480 px column. */
export default function Fab({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 z-30 flex size-16 items-center justify-center rounded-full bg-primary text-white shadow-lg active:opacity-80"
      style={{ right: 'max(16px, calc((100vw - 480px) / 2 + 16px))' }}
    >
      <Plus size={30} />
    </button>
  )
}
