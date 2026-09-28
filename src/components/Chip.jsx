/** Selectable chip. variant: "solid" (active = green fill) or "soft" (active = light green, outlined). */
export default function Chip({ active, onClick, children, variant = 'solid', className = '' }) {
  const activeClass =
    variant === 'soft' ? 'border-primary bg-primary-soft font-semibold text-primary' : 'border-primary bg-primary font-semibold text-white'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 border px-4 py-2.5 text-[15px] whitespace-nowrap ${active ? activeClass : 'border-border bg-bg text-muted'} ${className}`}
    >
      {children}
    </button>
  )
}
