// UMA (Unidad de Medida y Actualización) 2026, publicada por el INEGI
// (DOF, vigente desde el 1 de febrero de 2026).
export const UMA_DIARIA_2026 = 117.31

// Cuota obrera (parte que se le retiene al trabajador) del IMSS, conforme a
// la Ley del Seguro Social. Los % fijos no cambian por reforma de pensiones
// (esa reforma solo afecta la cuota patronal); son:
//   - Prestaciones en dinero:            0.25%  del SBC
//   - Gastos médicos de pensionados:     0.375% del SBC
//   - Invalidez y vida:                  0.625% del SBC
//   - Cesantía en edad avanzada y vejez: 1.125% del SBC
//   - Enfermedades y maternidad (excedente de 3 UMA): 0.40% sobre el SBC
//     que exceda 3 veces la UMA diaria.
const CUOTA_OBRERA_FIJA_PCT = 0.0025 + 0.00375 + 0.00625 + 0.01125 // 2.375%
const CUOTA_OBRERA_EXCEDENTE_PCT = 0.004 // 0.40% sobre excedente de 3 UMA

/**
 * Estima la cuota obrera del IMSS para un periodo de `diasPeriodo` días,
 * a partir de un Salario Base de Cotización (SBC) diario aproximado
 * (aquí se usa el salario bruto del periodo entre los días del periodo,
 * sin integrar aguinaldo/prima vacacional: es una aproximación).
 */
export function calcularIMSSObreroPeriodo(sbcDiario, diasPeriodo) {
  const sbc = Math.max(0, Number(sbcDiario) || 0)
  const topeExcedente = 3 * UMA_DIARIA_2026
  const excedenteDiario = Math.max(0, sbc - topeExcedente)

  const cuotaFijaDiaria = sbc * CUOTA_OBRERA_FIJA_PCT
  const cuotaExcedenteDiaria = excedenteDiario * CUOTA_OBRERA_EXCEDENTE_PCT

  const cuotaObreraPeriodo = (cuotaFijaDiaria + cuotaExcedenteDiaria) * diasPeriodo
  return cuotaObreraPeriodo
}
