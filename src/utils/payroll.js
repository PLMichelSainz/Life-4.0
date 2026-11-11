import { parseISODate, addDays } from './dates'
import { MODO_PERIODO, RECORRER_PAGO_A_HABIL, DESFASE_PAGO_QUINCENA_DIAS } from './config'

// =====================================================================
// QUINCENAS: pagos el día 15 y el último día de cada mes.
// Índice = año*24 + mes0*2 + (mitad B ? 1 : 0). No usa anclas de fecha.
//
// Dos vistas del mismo calendario de pagos:
//  - 'pago'       (Transporte, Presupuesto): la quincena arranca el día de pago.
//                 A: 15 -> penúltimo día del mes | B: último día -> 14 del mes siguiente
//  - 'calendario' (Horas extra, Calendario de pagos = periodo trabajado):
//                 A: 1 -> 15 (se paga el 15)     | B: 16 -> último día (se paga el último)
// Los periodos miden entre 13 y 16 días.
// =====================================================================

const pad2 = (n) => String(n).padStart(2, '0')
const isoDe = (y, m0, d) => `${y}-${pad2(m0 + 1)}-${pad2(d)}`

/** Último día del mes (m0 = 0..11). Maneja febrero y años bisiestos. */
export function ultimoDiaDelMes(year, m0) {
  return new Date(year, m0 + 1, 0).getDate()
}

function indiceDe(y, m0, mitadB) {
  return y * 24 + m0 * 2 + (mitadB ? 1 : 0)
}

function desindexar(k) {
  const y = Math.floor(k / 24)
  const r = k - y * 24
  return { y, m0: Math.floor(r / 2), mitadB: r % 2 === 1 }
}

/** Índice de la quincena a la que pertenece la fecha ISO. */
export function indiceQuincena(iso, modo = MODO_PERIODO) {
  const d = parseISODate(iso)
  const y = d.getFullYear()
  const m0 = d.getMonth()
  const dia = d.getDate()
  if (modo === 'calendario') return indiceDe(y, m0, dia >= 16)
  const ultimo = ultimoDiaDelMes(y, m0)
  if (dia >= 15 && dia < ultimo) return indiceDe(y, m0, false)
  if (dia === ultimo) return indiceDe(y, m0, true)
  // días 1..14 pertenecen al periodo B del mes anterior
  return m0 === 0 ? indiceDe(y - 1, 11, true) : indiceDe(y, m0 - 1, true)
}

function limitesQuincena(k, modo) {
  const { y, m0, mitadB } = desindexar(k)
  const ultimo = ultimoDiaDelMes(y, m0)
  const sig = m0 === 11 ? { y: y + 1, m0: 0 } : { y, m0: m0 + 1 }
  if (modo === 'calendario') {
    return mitadB
      ? { start: isoDe(y, m0, 16), end: isoDe(y, m0, ultimo), pagoNominal: isoDe(y, m0, ultimo) }
      : { start: isoDe(y, m0, 1), end: isoDe(y, m0, 15), pagoNominal: isoDe(y, m0, 15) }
  }
  return mitadB
    ? { start: isoDe(y, m0, ultimo), end: isoDe(sig.y, sig.m0, 14), pagoNominal: isoDe(y, m0, ultimo) }
    : { start: isoDe(y, m0, 15), end: isoDe(y, m0, ultimo - 1), pagoNominal: isoDe(y, m0, 15) }
}

// D2: adelanta un pago de fin de semana al viernes anterior (solo si el flag está activo).
function ajustarPago(iso) {
  if (!RECORRER_PAGO_A_HABIL) return iso
  const dow = parseISODate(iso).getDay()
  if (dow === 6) return addDays(iso, -1)
  if (dow === 0) return addDays(iso, -2)
  return iso
}

/** Devuelve { index, start, end, payDate, siguientePago, dias, etiqueta } de la quincena k. */
export function quincenaPorIndice(k, modo = MODO_PERIODO) {
  const { start, end, pagoNominal } = limitesQuincena(k, modo)
  const sig = limitesQuincena(k + 1, modo)
  const desfase = modo === 'calendario' ? DESFASE_PAGO_QUINCENA_DIAS : 0
  const payDate = ajustarPago(addDays(pagoNominal, desfase))
  const siguientePago = ajustarPago(addDays(sig.pagoNominal, desfase))
  const dias = Math.round((parseISODate(end) - parseISODate(start)) / 86400000) + 1
  const { y, m0, mitadB } = desindexar(k)
  return { index: k, start, end, payDate, siguientePago, dias, etiqueta: `${y}-${pad2(m0 + 1)}-${mitadB ? 'B' : 'A'}` }
}

/** Quincena que contiene `iso`. */
export function quincenaDe(iso, modo = MODO_PERIODO) {
  return quincenaPorIndice(indiceQuincena(iso, modo), modo)
}

/** Arreglo de fechas ISO de start a end, ambas inclusive (13–16 elementos). */
export function diasDeQuincena(start, end) {
  const n = Math.round((parseISODate(end) - parseISODate(start)) / 86400000) + 1
  return Array.from({ length: n }, (_, i) => addDays(start, i))
}

// ---- Periodo TRABAJADO (Horas extra / Calendario de pagos) ----
export const indiceQuincenaTrabajada = (iso) => indiceQuincena(iso, 'calendario')
export const quincenaTrabajadaPorIndice = (k) => quincenaPorIndice(k, 'calendario')

/** Lista de quincenas trabajadas alrededor de la actual: [antes..actual..despues]. */
export function listaQuincenas(iso, antes = 2, despues = 3) {
  const actual = indiceQuincenaTrabajada(iso)
  const lista = []
  for (let k = actual - antes; k <= actual + despues; k++) {
    lista.push({ ...quincenaTrabajadaPorIndice(k), esActual: k === actual })
  }
  return lista
}

/** Lunes (ISO) de cada semana que toca el rango start..end, en orden. */
export function semanasQueTocan(start, end) {
  const lunes = (iso) => {
    const dow = parseISODate(iso).getDay() // 0 = domingo
    return addDays(iso, dow === 0 ? -6 : 1 - dow)
  }
  const res = []
  for (let w = lunes(start); w <= end; w = addDays(w, 7)) res.push(w)
  return res
}
