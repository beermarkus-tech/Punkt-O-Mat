// German number formatting and parsing, spec.md §1.5.

const MINUS = '−'

/** Points: comma decimal, no trailing ",0", real minus sign. */
export function formatPoints(x) {
  const abs = Math.abs(x).toLocaleString('de-DE', { maximumFractionDigits: 1 })
  return x < 0 ? MINUS + abs : abs
}

/** Reference value (§1.2): always one decimal. */
export function formatRef(x) {
  return x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** Plain number for labels like "6 Gläser" or "1,5 Portionen". */
export function formatNumber(x) {
  return x.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

/** Parse user input that may use a comma as decimal separator. Empty or invalid → NaN. */
export function parseNumber(s) {
  const t = String(s ?? '').trim().replace(',', '.')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN
  return Number(t)
}

/** Number → input field text with a German comma. */
export function toInput(n) {
  return n == null ? '' : String(n).replace('.', ',')
}
