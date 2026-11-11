import { describe, it, expect } from 'vitest'
import { calcularIMSSObreroPeriodo, UMA_DIARIA_2026 } from './imss'

const cerca = (a, b) => expect(Math.abs(a - b) < 0.01).toBe(true)

describe('IMSS cuota obrera', () => {
  it('SBC $330 (bajo 3 UMA = $351.93): solo 2.375 % × 15 días', () => {
    expect(UMA_DIARIA_2026).toBe(117.31)
    cerca(calcularIMSSObreroPeriodo(330, 15), 330 * 0.02375 * 15)
  })
  it('SBC sobre 3 UMA suma 0.40 % del excedente', () => {
    const sbc = 500
    const exc = sbc - 3 * 117.31
    cerca(calcularIMSSObreroPeriodo(sbc, 15), (sbc * 0.02375 + exc * 0.004) * 15)
  })
  it('SBC 0 o inválido no rompe', () => {
    expect(calcularIMSSObreroPeriodo(0, 15)).toBe(0)
    expect(calcularIMSSObreroPeriodo('x', 15)).toBe(0)
  })
})
