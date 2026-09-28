import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { inputClass } from '../../components/form'

const NEW = '__new__'

/** Pick an existing food category, or switch to typing a new one (spec.md §4.3). */
export default function CategoryPicker({ value, onChange, categories, error }) {
  const [typing, setTyping] = useState(() => categories.length === 0 || (value !== '' && !categories.includes(value)))

  if (typing) {
    return (
      <div className="flex flex-col gap-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Neue Kategorie"
          autoFocus={categories.length > 0}
          className={inputClass(error)}
        />
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setTyping(false)
              onChange('')
            }}
            className="self-start px-1 py-1 text-sm font-semibold text-primary"
          >
            Aus Liste wählen
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === NEW) {
            setTyping(true)
            onChange('')
          } else onChange(e.target.value)
        }}
        className={`${inputClass(error)} appearance-none pr-10 ${value ? '' : 'text-muted'}`}
      >
        <option value="" disabled>
          Bitte wählen …
        </option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value={NEW}>+ Neue Kategorie …</option>
      </select>
      <ChevronDown size={20} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
    </div>
  )
}
