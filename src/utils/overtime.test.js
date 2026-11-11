import { describe, it, expect } from 'vitest'
import { calcularSemana, calcularSemanaParcial, TARIFA_ORDINARIA, TARIFA_DOBLE } from './overtime'

const SEM = '2026-09-07'
const cerca = (a, b) => expect(Math.abs(a - b) < 0.01).toBe(true)

describe('calcularSemanaParcial', () => {
  it('semana completa = calcularSemana', () => {
    const h = [10, 10, 10, 10, 10, 5, 0]
    cerca(calcularSemanaParcial(h, SEM, 0, 6).total_pago, calcularSemana(h, SEM).total_pago)
  })

  it('las dos partes de una semana partida suman el total de la semana', () => {
    const h = [10, 10, 10, 10, 10, 5, 0] // 55 h -> 7 extras
    for (let corte = 1; corte <= 6; corte++) {
      const a = calcularSemanaParcial(h, SEM, 0, corte - 1)
      const b = calcularSemanaParcial(h, SEM, corte, 6)
      cerca(a.total_pago + b.total_pago, calcularSemana(h, SEM).total_pago)
      cerca(a.total + b.total, 55)
    }
  })

  it('las horas extra se pagan en la parte donde ocurren', () => {
    const h = [10, 10, 10, 10, 10, 5, 0]
    const antes = calcularSemanaParcial(h, SEM, 0, 3) // 40 h, sin extras
    const despues = calcularSemanaParcial(h, SEM, 4, 6) // cruza las 48 h
    expect(antes.extraDoble).toBe(0)
    expect(despues.extraDoble).toBe(7)
    cerca(despues.pagoDoble, 7 * TARIFA_DOBLE)
    cerca(antes.pagoOrdinario, 40 * TARIFA_ORDINARIA)
  })
})

describe('tarifa derivada del salario diario', () => {
  it('330 ÷ 9 h = 36.67/h; solo el extra se paga aparte', () => {
    cerca(TARIFA_ORDINARIA, 330 / 9)
    const h = [10, 10, 10, 10, 10, 5, 0] // 55 h -> 7 extras dobles
    const r = calcularSemana(h, SEM)
    cerca(r.pagoExtra, 7 * 2 * (330 / 9))
    cerca(r.total_pago, r.pagoOrdinario + r.pagoExtra)
  })
  it('semana de 5 días × 9 h = 45 h no genera extras', () => {
    expect(calcularSemana([9, 9, 9, 9, 9, 0, 0], SEM).pagoExtra).toBe(0)
  })
  it('acepta tarifa distinta y parcial suma igual', () => {
    const h = [10, 10, 10, 10, 10, 5, 0]
    const t = 40
    const a = calcularSemanaParcial(h, SEM, 0, 2, t)
    const b = calcularSemanaParcial(h, SEM, 3, 6, t)
    cerca(a.pagoExtra + b.pagoExtra, calcularSemana(h, SEM, t).pagoExtra)
  })
})
