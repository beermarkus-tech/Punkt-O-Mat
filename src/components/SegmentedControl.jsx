export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex rounded-card border border-border bg-card p-1.5" role="tablist">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-chip py-2.5 text-[15px] ${active ? 'bg-primary font-semibold text-white' : 'text-muted'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
