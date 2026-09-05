import { translations } from '../i18n/translations'

export const DAY_MS = 24 * 60 * 60 * 1000

export function toISODate(date) {
  const d = new Date(date)
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10)
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso, n) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function startOfWeekMonday(iso) {
  const d = parseISODate(iso)
  const day = d.getDay() // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toISODate(d)
}

function dict(locale) {
  return translations[locale] || translations.es
}

export function dayName(iso, short = false, locale = 'es') {
  const d = parseISODate(iso)
  const { full, short: shortArr } = dict(locale).days
  return (short ? shortArr : full)[d.getDay()]
}

export function formatShort(iso, locale = 'es') {
  const d = parseISODate(iso)
  const meses = dict(locale).months
  return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]}`
}

export function formatLong(iso, locale = 'es') {
  const d = parseISODate(iso)
  const meses = dict(locale).months
  if (locale === 'en') {
    return `${dayName(iso, false, locale)}, ${meses[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
  }
  return `${dayName(iso, false, locale)} ${String(d.getDate()).padStart(2, '0')} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

export function todayISO() {
  return toISODate(new Date())
}
