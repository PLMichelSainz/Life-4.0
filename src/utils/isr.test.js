import { describe, it, expect } from 'vitest'
import { calcularISRPeriodo, SUBSIDIO_EMPLEO_MENSUAL_2026 } from './isr'

const cerca = (a, b, tol = 0.01) => expect(Math.abs(a - b) < tol).toBe(true)

describe('ISR quincenal 2026 (15 días)', () => {
  it('subsidio vigente 2026', () => {
    expect(SUBSIDIO_EMPLEO_MENSUAL_2026.tope).toBe(11492.66)
    expect(SUBSIDIO_EMPLEO_MENSUAL_2026.monto).toBe(535.65)
  })

  it('quincena de $4,950 (sueldo mensual $9,900): ISR bruto ≈ 361.43, subsidio ≈ 264.30', () => {
    const r = calcularISRPeriodo(4950, 15)
    cerca(r.isrBruto, 361.43)
    cerca(r.subsidio, (535.65 * 15) / 30.4)
    cerca(r.isrNeto, r.isrBruto - r.subsidio)
  })

  it('sin subsidio si el ingreso mensual equivalente supera $11,492.66', () => {
    const r = calcularISRPeriodo(6000, 15) // ≈ $12,160 al mes
    expect(r.subsidio).toBe(0)
  })
})
