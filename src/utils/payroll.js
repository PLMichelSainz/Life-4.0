import { parseISODate, addDays } from './dates'

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
