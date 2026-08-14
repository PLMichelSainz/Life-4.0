import { parseISODate, addDays, toISODate } from './dates'

export const FECHA_REFERENCIA = '2026-08-14' // viernes de pago base

/**
 * Devuelve el índice de catorcena (entero, puede ser negativo para el
 * pasado) al que pertenece la fecha dada, tomando FECHA_REFERENCIA como
 * el día de pago (viernes) del índice 0.
 */
export function indiceCatorcena(iso) {
  const ref = parseISODate(FECHA_REFERENCIA)
  const dia = parseISODate(iso)
  const diffDias = Math.round((dia - ref) / 86400000)
  return Math.ceil(diffDias / 14)
}

/** Fecha de pago (viernes) de la catorcena con índice k. */
export function fechaPagoCatorcena(k) {
  return addDays(FECHA_REFERENCIA, 14 * k)
}

/** Devuelve { index, start, end, payDate } de la catorcena que contiene `iso`. */
export function catorcenaDe(iso) {
  const k = indiceCatorcena(iso)
  const payDate = fechaPagoCatorcena(k)
  const start = addDays(payDate, -13)
  return { index: k, start, end: payDate, payDate }
}

/** Genera una lista de catorcenas alrededor de la actual: [antes..actual..despues]. */
export function listaCatorcenas(iso, antes = 2, despues = 3) {
  const actual = indiceCatorcena(iso)
  const lista = []
  for (let k = actual - antes; k <= actual + despues; k++) {
    const payDate = fechaPagoCatorcena(k)
    const start = addDays(payDate, -13)
    lista.push({ index: k, start, end: payDate, payDate, esActual: k === actual })
  }
  return lista
}

/** Devuelve un arreglo con las 14 fechas ISO de una catorcena, de start a end. */
export function diasDeCatorcena(start) {
  return Array.from({ length: 14 }, (_, i) => addDays(start, i))
}
