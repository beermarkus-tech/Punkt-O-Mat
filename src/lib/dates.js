// All day IDs are the local date in Europe/Paris, yyyy-mm-dd (spec.md §2).
// Never use toISOString() for this — it is UTC and gives the wrong day around midnight.

const TZ = 'Europe/Paris'
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export function dateId(date = new Date()) {
  return dayFormat.format(date)
}

export const todayId = () => dateId(new Date())

/** Hours and minutes of a moment, in Europe/Paris. */
export function parisTime(date = new Date()) {
  const parts = Object.fromEntries(timeFormat.formatToParts(date).map((p) => [p.type, p.value]))
  return { h: Number(parts.hour), m: Number(parts.minute) }
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.']

/** "So, 27. Sept." (spec.md §1.5). */
export function formatDateLabel(id) {
  const [y, m, d] = id.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${WEEKDAYS[weekday]}, ${d}. ${MONTHS[m - 1]}`
}

/** Food Rubrik suggested by time of day (spec.md §4.2). */
export function suggestSection(date = new Date()) {
  const { h, m } = parisTime(date)
  const minutes = h * 60 + m
  if (minutes >= 4 * 60 && minutes < 11 * 60) return 'morgens'
  if (minutes >= 11 * 60 && minutes < 15 * 60) return 'mittags'
  if (minutes >= 15 * 60 && minutes < 17 * 60 + 30) return 'zwischendurch'
  if (minutes >= 17 * 60 + 30 && minutes < 22 * 60) return 'abends'
  return 'zwischendurch'
}

export const SECTIONS = [
  { id: 'morgens', label: 'Morgens' },
  { id: 'mittags', label: 'Mittags' },
  { id: 'abends', label: 'Abends' },
  { id: 'zwischendurch', label: 'Zwischendurch' },
]

function toUTC(id) {
  const [y, m, d] = id.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUTC(date) {
  return date.toISOString().slice(0, 10) // safe here: the Date is a pure UTC calendar date, not a moment in time
}

/** Day ID n days after `id` (negative = before). */
export function addDays(id, n) {
  const d = toUTC(id)
  d.setUTCDate(d.getUTCDate() + n)
  return fromUTC(d)
}

/** The seven day IDs Monday..Sunday of the week containing `id` (weeks start Monday, spec.md §1.4). */
export function weekDates(id) {
  const monday = addDays(id, -((toUTC(id).getUTCDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

/** Header label: HEUTE / GESTERN / MORGEN, otherwise the weekday (spec.md §1.5). */
export function relativeDayLabel(id, today = todayId()) {
  if (id === today) return 'Heute'
  if (id === addDays(today, -1)) return 'Gestern'
  if (id === addDays(today, 1)) return 'Morgen'
  return WEEKDAYS_LONG[toUTC(id).getUTCDay()]
}

/** Same calendar day `n` months earlier/later, clamped to the month's last day. */
export function addMonths(id, n) {
  const [y, m, d] = id.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate()
  return fromUTC(new Date(Date.UTC(y, m - 1 + n, Math.min(d, lastDay))))
}

/** Day ID → milliseconds at UTC midnight, for time-scaled chart axes. */
export const dayMs = (id) => toUTC(id).getTime()
