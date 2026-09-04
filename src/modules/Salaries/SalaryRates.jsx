import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { formatMXN } from '../../utils/overtime'
import { calcularISRPeriodo } from '../../utils/isr'

const DIAS_CATORCENA = 14
const SEMANAS_CATORCENA = 2
const JORNADAS_WH = [35, 40, 42, 46]

export default function SalaryRates() {
  const { tarifaPorHora, setTarifaPorHora } = useAppData()
  const [tarifaInput, setTarifaInput] = useState(String(tarifaPorHora))

  const filas = useMemo(() => {
    return JORNADAS_WH.map((wh) => {
      const bruto = tarifaPorHora * wh * SEMANAS_CATORCENA
      const { isrNeto } = calcularISRPeriodo(bruto, DIAS_CATORCENA)
      const neto = Math.max(0, bruto - isrNeto)
      return { wh, bruto, isr: isrNeto, neto }
    })
  }, [tarifaPorHora])

  function guardarTarifa(e) {
    e.preventDefault()
    const valor = Number(tarifaInput)
    if (!valor || valor <= 0) return
    setTarifaPorHora(valor)
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">Tarifa por hora</p>
        <form onSubmit={guardarTarifa} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Tarifa por hora (MXN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tarifaInput}
              onChange={(e) => setTarifaInput(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <button type="submit" className="btn primary">Guardar</button>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Salario por catorcena, según horas semanales (WH)</p>
        <p className="card-sub">Catorcena = 2 semanas. Tarifa actual: {formatMXN(tarifaPorHora)}/hora.</p>

        {filas.map((f) => (
          <div key={f.wh} style={{ marginBottom: 14 }}>
            <div className="day-name" style={{ marginBottom: 6 }}>{f.wh} WH</div>
            <div className="grid cols-3">
              <div className="stat">
                <div className="label">Bruto (sin ISR)</div>
                <div className="value mono">{formatMXN(f.bruto)}</div>
              </div>
              <div className="stat" style={{ borderColor: 'var(--danger)' }}>
                <div className="label">ISR retenido</div>
                <div className="value mono" style={{ color: 'var(--danger)' }}>-{formatMXN(f.isr)}</div>
              </div>
              <div className="stat" style={{ borderColor: 'var(--accent)' }}>
                <div className="label">Neto (con ISR)</div>
                <div className="value accent mono">{formatMXN(f.neto)}</div>
              </div>
            </div>
          </div>
        ))}

        <p className="card-sub" style={{ marginTop: 4, marginBottom: 0 }}>
          Cálculo estimado con la tarifa oficial de ISR 2026 (Art. 96 LISR) prorateada a 14 días.
          El monto real puede variar por bonos, comisiones u otras percepciones/deducciones.
        </p>
      </div>
    </div>
  )
}
