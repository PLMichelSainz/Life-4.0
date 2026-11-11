import { describe, it, expect } from 'vitest'
import { indiceQuincena, quincenaPorIndice, quincenaDe, diasDeQuincena, ultimoDiaDelMes } from './payroll'

describe('quincenas (modo pago)', () => {
  it('14 ene es periodo B de diciembre previo; 15 ene es A de enero', () => {
    const q14 = quincenaDe('2027-01-14')
    expect(q14.start).toBe('2026-12-31')
    expect(q14.end).toBe('2027-01-14')
    expect(q14.etiqueta).toBe('2026-12-B')
    const q15 = quincenaDe('2027-01-15')
    expect(q15.start).toBe('2027-01-15')
    expect(q15.end).toBe('2027-01-30')
    expect(q15.etiqueta).toBe('2027-01-A')
  })

  it('30 ene es A; 31 ene es B', () => {
    expect(quincenaDe('2027-01-30').etiqueta).toBe('2027-01-A')
    expect(quincenaDe('2027-01-31').etiqueta).toBe('2027-01-B')
  })

  it('febrero 2027 (28 días) y 2028 (29, bisiesto)', () => {
    expect(ultimoDiaDelMes(2027, 1)).toBe(28)
    expect(ultimoDiaDelMes(2028, 1)).toBe(29)
    const a27 = quincenaDe('2027-02-20')
    expect(a27.end).toBe('2027-02-27')
    expect(a27.siguientePago).toBe('2027-02-28')
    const b27 = quincenaDe('2027-02-28')
    expect(b27.start).toBe('2027-02-28')
    expect(b27.end).toBe('2027-03-14')
    const b28 = quincenaDe('2028-02-29')
    expect(b28.start).toBe('2028-02-29')
    expect(b28.payDate).toBe('2028-02-29')
  })

  it('cambio de año 31 dic -> 1 ene', () => {
    const dic = quincenaDe('2026-12-31')
    const ene = quincenaDe('2027-01-01')
    expect(ene.index).toBe(dic.index)
    expect(quincenaDe('2027-01-15').index).toBe(dic.index + 1)
  })

  it('diasDeQuincena devuelve entre 13 y 16', () => {
    const largos = new Set()
    for (let k = quincenaDe('2026-01-01').index; k < quincenaDe('2028-12-31').index; k++) {
      const q = quincenaPorIndice(k)
      const dias = diasDeQuincena(q.start, q.end)
      expect(dias.length).toBe(q.dias)
      expect(dias.length).toBeGreaterThanOrEqual(13)
      expect(dias.length).toBeLessThanOrEqual(16)
      largos.add(dias.length)
    }
    expect(largos.has(13) && largos.has(15) && largos.has(16)).toBe(true)
  })

  it('quincenaPorIndice(indiceQuincena(x)) es idempotente y contiene x; los periodos son contiguos', () => {
    let prevEnd = null
    for (let d = new Date(2026, 0, 1); d < new Date(2029, 0, 1); d.setDate(d.getDate() + 1)) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const k = indiceQuincena(iso)
      const q = quincenaPorIndice(k)
      expect(indiceQuincena(q.start)).toBe(k)
      expect(indiceQuincena(q.end)).toBe(k)
      expect(iso >= q.start && iso <= q.end).toBe(true)
    }
    for (let k = 24 * 2026; k < 24 * 2028; k++) {
      const q = quincenaPorIndice(k)
      if (prevEnd) {
        const sig = new Date(prevEnd.slice(0, 4), prevEnd.slice(5, 7) - 1, Number(prevEnd.slice(8)) + 1)
        const sigISO = `${sig.getFullYear()}-${String(sig.getMonth() + 1).padStart(2, '0')}-${String(sig.getDate()).padStart(2, '0')}`
        expect(q.start).toBe(sigISO)
      }
      prevEnd = q.end
    }
  })
})
