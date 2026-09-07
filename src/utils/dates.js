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

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function dayName(iso, short = false) {
  const d = parseISODate(iso)
  return (short ? DIAS_CORTO : DIAS)[d.getDay()]
}

export function formatShort(iso) {
  const d = parseISODate(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`
}

export function formatLong(iso) {
  const d = parseISODate(iso)
  return `${dayName(iso)} ${String(d.getDate()).padStart(2, '0')} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

export function todayISO() {
  return toISODate(new Date())
}
