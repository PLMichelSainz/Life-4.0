import { parseISODate, addDays } from './dates'
import { MODO_PERIODO, RECORRER_PAGO_A_HABIL } from './config'

// Lunes de inicio del periodo trabajado de referencia (índice 0).
// Periodo 27/jul–09/ago/2026 -> se paga el 14/ago/2026.
export const ANCHOR_START = '2026-07-27'

// Días que transcurren entre el fin del periodo trabajado (domingo) y el
// día de pago (viernes siguiente-siguiente): domingo 09/ago -> viernes 14/ago = 5 días.
export const DESFASE_PAGO_DIAS = 5

/**
 * Índice de catorcena (entero, puede ser negativo hacia el pasado) al que
 * pertenece la fecha dada. El periodo con índice 0 es el que va de
 * ANCHOR_START a ANCHOR_START+13 días.
 */
export function indiceCatorcena(iso) {
  const inicio = parseISODate(ANCHOR_START)
  const dia = parseISODate(iso)
  const diffDias = Math.round((dia - inicio) / 86400000)
  return Math.floor(diffDias / 14)
}

/** Devuelve { index, start, end, payDate } del periodo con índice k. */
export function catorcenaPorIndice(k) {
  const start = addDays(ANCHOR_START, 14 * k)
  const end = addDays(start, 13)
  const payDate = addDays(end, DESFASE_PAGO_DIAS)
  return { index: k, start, end, payDate }
}

/** Devuelve { index, start, end, payDate } de la catorcena que contiene `iso`. */
export function catorcenaDe(iso) {
  return catorcenaPorIndice(indiceCatorcena(iso))
}

/** Indica si la fecha dada es un viernes de pago (catorcenal). */
export function esViernesDePago(iso) {
  const inicio = parseISODate(ANCHOR_START)
  const dia = parseISODate(iso)
  // El primer viernes de pago es ANCHOR_START + 13 días (fin del periodo 0) + 5 días.
  const primerPago = new Date(inicio)
  primerPago.setDate(primerPago.getDate() + 13 + DESFASE_PAGO_DIAS)
  const diffDias = Math.round((dia - primerPago) / 86400000)
  return diffDias % 14 === 0
}

// --- Periodo de presupuesto para Transporte: ligado directamente al día de
// pago (a diferencia del periodo "trabajado" de arriba, usado en Horas
// extra y en el módulo de Catorcenas). Aquí el primer día de la catorcena
// ES el viernes de pago, y el último día es justo antes del siguiente pago.
// Referencia confirmada: viernes 11/sep/2026 fue día de pago real.
export const ANCHOR_PAGO_TRANSPORTE = '2026-09-11'

export function indiceCatorcenaPago(iso) {
  const inicio = parseISODate(ANCHOR_PAGO_TRANSPORTE)
  const dia = parseISODate(iso)
  const diffDias = Math.round((dia - inicio) / 86400000)
  return Math.floor(diffDias / 14)
}

export function catorcenaPagoPorIndice(k) {
  const start = addDays(ANCHOR_PAGO_TRANSPORTE, 14 * k)
  const end = addDays(start, 13)
  const siguientePago = addDays(start, 14)
  return { index: k, start, end, payDate: start, siguientePago }
}

export function catorcenaPagoDe(iso) {
  return catorcenaPagoPorIndice(indiceCatorcenaPago(iso))
}

/** Genera una lista de catorcenas alrededor de la actual: [antes..actual..despues]. */
export function listaCatorcenas(iso, antes = 2, despues = 3) {
  const actual = indiceCatorcena(iso)
  const lista = []
  for (let k = actual - antes; k <= actual + despues; k++) {
    lista.push({ ...catorcenaPorIndice(k), esActual: k === actual })
  }
  return lista
}

/** Devuelve un arreglo con las 14 fechas ISO de una catorcena, de start a end. */
export function diasDeCatorcena(start) {
  return Array.from({ length: 14 }, (_, i) => addDays(start, i))
}


// =====================================================================
// QUINCENAS (esquema vigente): pagos el día 15 y el último día del mes.
// Índice = año*24 + mes0*2 + (mitad B ? 1 : 0). No usa anclas de fecha.
//   modo 'pago'       A: 15 -> penúltimo día del mes | B: último día -> 14 del mes siguiente
//   modo 'calendario' A: 1 -> 15                     | B: 16 -> último día
// Los periodos miden entre 14 y 16 días.
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
export function indiceQuincena(iso) {
  const d = parseISODate(iso)
  const y = d.getFullYear()
  const m0 = d.getMonth()
  const dia = d.getDate()
  if (MODO_PERIODO === 'calendario') return indiceDe(y, m0, dia >= 16)
  const ultimo = ultimoDiaDelMes(y, m0)
  if (dia >= 15 && dia < ultimo) return indiceDe(y, m0, false)
  if (dia === ultimo) return indiceDe(y, m0, true)
  // días 1..14 pertenecen al periodo B del mes anterior
  return m0 === 0 ? indiceDe(y - 1, 11, true) : indiceDe(y, m0 - 1, true)
}

function limitesQuincena(k) {
  const { y, m0, mitadB } = desindexar(k)
  const ultimo = ultimoDiaDelMes(y, m0)
  const sig = m0 === 11 ? { y: y + 1, m0: 0 } : { y, m0: m0 + 1 }
  if (MODO_PERIODO === 'calendario') {
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
export function quincenaPorIndice(k) {
  const { start, end, pagoNominal } = limitesQuincena(k)
  const sig = limitesQuincena(k + 1)
  const payDate = ajustarPago(pagoNominal)
  const siguientePago = ajustarPago(sig.pagoNominal)
  const dias = Math.round((parseISODate(end) - parseISODate(start)) / 86400000) + 1
  const { y, m0, mitadB } = desindexar(k)
  return { index: k, start, end, payDate, siguientePago, dias, etiqueta: `${y}-${pad2(m0 + 1)}-${mitadB ? 'B' : 'A'}` }
}

/** Quincena que contiene `iso`. */
export function quincenaDe(iso) {
  return quincenaPorIndice(indiceQuincena(iso))
}

/** Arreglo de fechas ISO de start a end, ambas inclusive (14–16 elementos). */
export function diasDeQuincena(start, end) {
  const n = Math.round((parseISODate(end) - parseISODate(start)) / 86400000) + 1
  return Array.from({ length: n }, (_, i) => addDays(start, i))
}
