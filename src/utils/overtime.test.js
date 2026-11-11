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
