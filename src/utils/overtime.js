import { parseISODate } from './dates'

export const TARIFA_ORDINARIA = 52.76
export const TARIFA_DOBLE = TARIFA_ORDINARIA * 2 // 105.52
export const TARIFA_TRIPLE = TARIFA_ORDINARIA * 3 // 158.28

export const LIMITE_LEGAL_SEMANAL = 48
export const CAMBIO_JORNADA_FECHA = '2026-08-31'

/**
 * Jornada ordinaria de referencia (informativa): 35 hrs hasta el 30/08/2026,
 * 30 hrs a partir del 31/08/2026. Esta cifra se muestra como referencia legal;
 * el cálculo de pago sigue el umbral de 48 hrs semanales indicado en el
 * requerimiento del producto.
 */
export function jornadaOrdinaria(weekStartISO) {
  const cambio = parseISODate(CAMBIO_JORNADA_FECHA)
  const inicio = parseISODate(weekStartISO)
  return inicio >= cambio ? 30 : 35
}

/**
 * Calcula el desglose de pago de una semana dado un arreglo de 7 horas
 * trabajadas (una por día).
 *
 * Regla de negocio (según especificación):
 *  - Horas 1..48 semanales -> tarifa ordinaria.
 *  - A partir de la hora 48, aplica el límite de 12 horas extra máximas:
 *      - Extra 1 a 9  -> tarifa doble.
 *      - Extra 10 a 12 -> tarifa triple.
 *  - Cualquier hora reportada más allá de 60 (48 + 12) excede el límite
 *    legal de horas extra; se marca como excedente y se paga a tarifa
 *    triple, mostrando una alerta.
 */
export function calcularSemana(horasPorDia, weekStartISO) {
  const total = horasPorDia.reduce((a, b) => a + (Number(b) || 0), 0)

  const ordinarias = Math.min(total, LIMITE_LEGAL_SEMANAL)
  const extras = Math.max(0, total - LIMITE_LEGAL_SEMANAL)

  const extraDoble = Math.min(extras, 9)
  const extraTriple = Math.min(Math.max(extras - 9, 0), 3)
  const excedente = Math.max(0, extras - 12)

  const pagoOrdinario = ordinarias * TARIFA_ORDINARIA
  const pagoDoble = extraDoble * TARIFA_DOBLE
  const pagoTriple = extraTriple * TARIFA_TRIPLE
  const pagoExcedente = excedente * TARIFA_TRIPLE

  const total_pago = pagoOrdinario + pagoDoble + pagoTriple + pagoExcedente

  return {
    total,
    ordinarias,
    extraDoble,
    extraTriple,
    excedente,
    pagoOrdinario,
    pagoDoble,
    pagoTriple,
    pagoExcedente,
    total_pago,
    jornadaOrdinaria: jornadaOrdinaria(weekStartISO),
    excedeLimiteLegal: excedente > 0,
  }
}

export function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
}

/**
 * Calcula cuánto depositar a una tarjeta que cobra comisión por recarga,
 * de modo que, después de descontar la comisión, quede exactamente
 * cubierto (o ligeramente por encima, por el redondeo a centavos) el
 * monto faltante.
 */
export function calcularRecarga(falta, comisionPct = 0.03) {
  if (falta <= 0) {
    return { falta: 0, montoTransferir: 0, comision: 0, quedaRecargado: 0 }
  }
  // "Quedará recargado" es la cifra cerrada (sin centavos): se redondea
  // hacia arriba para asegurar que cubra lo que falta. El monto a transferir
  // sí puede llevar centavos, ya que es lo que hay que enviar para que,
  // después de descontar la comisión, quede exactamente ese entero recargado.
  const quedaRecargado = Math.ceil(falta)
  const montoTransferir = Math.round((quedaRecargado / (1 - comisionPct)) * 100) / 100
  const comision = Math.round((montoTransferir - quedaRecargado) * 100) / 100
  return { falta, montoTransferir, comision, quedaRecargado }
}
