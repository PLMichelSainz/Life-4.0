// Tarifa oficial mensual del Art. 96 LISR 2026 (Anexo 8 RMF, DOF 28/dic/2025).
// Los % marginales se mantienen; los límites y la cuota fija se prorratean
// al periodo de pago real (ver calcularISRPeriodo).
export const TARIFA_ISR_MENSUAL_2026 = [
  { limiteInferior: 0.01, limiteSuperior: 844.59, cuotaFija: 0.0, pctExcedente: 0.0192 },
  { limiteInferior: 844.6, limiteSuperior: 7168.51, cuotaFija: 16.22, pctExcedente: 0.064 },
  { limiteInferior: 7168.52, limiteSuperior: 12598.02, cuotaFija: 420.95, pctExcedente: 0.1088 },
  { limiteInferior: 12598.03, limiteSuperior: 14644.64, cuotaFija: 1011.68, pctExcedente: 0.16 },
  { limiteInferior: 14644.65, limiteSuperior: 17533.64, cuotaFija: 1339.14, pctExcedente: 0.1792 },
  { limiteInferior: 17533.65, limiteSuperior: 35362.83, cuotaFija: 1856.84, pctExcedente: 0.2136 },
  { limiteInferior: 35362.84, limiteSuperior: 55736.68, cuotaFija: 5665.16, pctExcedente: 0.2352 },
  { limiteInferior: 55736.69, limiteSuperior: 106410.5, cuotaFija: 10457.09, pctExcedente: 0.3 },
  { limiteInferior: 106410.51, limiteSuperior: 141880.66, cuotaFija: 25659.23, pctExcedente: 0.32 },
  { limiteInferior: 141880.67, limiteSuperior: 425641.99, cuotaFija: 37009.69, pctExcedente: 0.34 },
  { limiteInferior: 425642.0, limiteSuperior: Infinity, cuotaFija: 133488.54, pctExcedente: 0.35 },
]

// Subsidio al empleo mensual 2026 (DOF 01/05/2024): monto fijo hasta $406.83
// para ingresos mensuales de hasta $9,081.00.
export const SUBSIDIO_EMPLEO_MENSUAL_2026 = { tope: 9081.0, monto: 406.83 }

// Días de referencia que usa el SAT para prorratear la tarifa mensual a
// periodos distintos (semanal, decenal, catorcenal, etc.).
const DIAS_MES_REFERENCIA = 30.4

/**
 * Calcula el ISR (bruto, subsidio y neto) para un ingreso gravable de un
 * periodo de `diasPeriodo` días, prorrateando la tarifa mensual oficial.
 * Para una catorcena: calcularISRPeriodo(ingresoGravable, 14).
 */
export function calcularISRPeriodo(ingresoGravable, diasPeriodo) {
  const ingreso = Math.max(0, Number(ingresoGravable) || 0)
  const factor = diasPeriodo / DIAS_MES_REFERENCIA

  const renglon =
    TARIFA_ISR_MENSUAL_2026.find(
      (r) => ingreso >= r.limiteInferior * factor && ingreso <= r.limiteSuperior * factor
    ) || TARIFA_ISR_MENSUAL_2026[TARIFA_ISR_MENSUAL_2026.length - 1]

  const limiteInferior = renglon.limiteInferior * factor
  const cuotaFija = renglon.cuotaFija * factor
  const isrBruto = cuotaFija + (ingreso - limiteInferior) * renglon.pctExcedente

  const topeSubsidio = SUBSIDIO_EMPLEO_MENSUAL_2026.tope * factor
  const subsidio = ingreso <= topeSubsidio ? SUBSIDIO_EMPLEO_MENSUAL_2026.monto * factor : 0

  const isrNeto = Math.max(0, isrBruto - subsidio)

  return { isrBruto, subsidio, isrNeto }
}
