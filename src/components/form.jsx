export function Field({ label, required, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-muted">
        {label}
        {required && ' *'}
      </span>
      {children}
      {error && <span className="text-sm text-accent">{error}</span>}
    </label>
  )
}

export const inputClass = (error) =>
  `w-full rounded-chip border bg-card px-4 py-3 text-base outline-none focus:border-primary ${error ? 'border-accent' : 'border-border'}`

export const primaryButtonClass = 'w-full rounded-chip bg-primary py-4 text-lg font-semibold text-white active:opacity-80'
export const deleteButtonClass = 'w-full rounded-chip py-3 font-semibold text-accent active:bg-border'

/** Error text for a required non-negative / positive number field. */
export function numberError(text, value, { positive = false } = {}) {
  if (String(text).trim() === '') return 'Pflichtfeld'
  if (Number.isNaN(value)) return 'Bitte eine Zahl eingeben'
  if (positive ? value <= 0 : value < 0) return positive ? 'Muss größer als 0 sein' : 'Darf nicht negativ sein'
  return null
}
