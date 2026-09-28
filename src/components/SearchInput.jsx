import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3.5">
      <Search size={20} className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Suchen …"
        aria-label="Suchen"
        className="w-full bg-transparent text-base outline-none placeholder:text-muted"
      />
    </div>
  )
}
