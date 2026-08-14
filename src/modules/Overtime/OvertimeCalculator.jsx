import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { startOfWeekMonday, addDays, todayISO, formatShort, dayName } from '../../utils/dates'
import { calcularSemana, formatMXN, LIMITE_LEGAL_SEMANAL } from '../../utils/overtime'

const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function OvertimeCalculator() {
  const { horasPorSemana, setHorasDia } = useAppData()
  const [weekStart, setWeekStart] = useState(startOfWeekMonday(todayISO()))

  const horas = horasPorSemana[weekStart] || [0, 0, 0, 0, 0, 0, 0]
  const resultado = useMemo(() => calcularSemana(horas, weekStart), [horas, weekStart])

  const cambiaSemana = (delta) => setWeekStart((w) => addDays(w, delta * 7))

  return (
    <div>
      <div className="card">
        <p className="card-title">Semana</p>
        <p className="card-sub">
          Jornada ordinaria de referencia: <b className="mono">{resultado.jornadaOrdinaria} hrs</b> semanales
          {resultado.jornadaOrdinaria === 30 && ' (vigente desde el 31/08/2026)'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button className="btn" onClick={() => cambiaSemana(-1)}>‹ Anterior</button>
          <div className="mono" style={{ flex: 1, textAlign: 'center' }}>
            {formatShort(weekStart)} — {formatShort(addDays(weekStart, 6))}
          </div>
          <button className="btn" onClick={() => cambiaSemana(1)}>Siguiente ›</button>
        </div>

        {NOMBRES_DIA.map((nombre, i) => {
          const fecha = addDays(weekStart, i)
          return (
            <div className="day-row" key={fecha}>
              <div>
                <div className="day-name">{nombre}</div>
                <div className="day-date">{formatShort(fecha)}</div>
              </div>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                style={{ maxWidth: 110 }}
                value={horas[i] === 0 ? '' : horas[i]}
                placeholder="0"
                onChange={(e) => setHorasDia(weekStart, i, Number(e.target.value) || 0)}
              />
            </div>
          )
        })}
      </div>

      <div className="card">
        <p className="card-title">Desglose de pago</p>
        <p className="card-sub">Total trabajado: <b className="mono">{resultado.total} hrs</b> · Límite legal semanal: {LIMITE_LEGAL_SEMANAL} hrs</p>

        <div className="grid cols-3">
          <div className="stat">
            <div className="label">Ordinarias</div>
            <div className="value mono">{resultado.ordinarias} hrs</div>
            <div className="label mono">{formatMXN(resultado.pagoOrdinario)}</div>
          </div>
          <div className="stat">
            <div className="label">Extra doble (1–9)</div>
            <div className="value mono accent">{resultado.extraDoble} hrs</div>
            <div className="label mono">{formatMXN(resultado.pagoDoble)}</div>
          </div>
          <div className="stat">
            <div className="label">Extra triple (10–12)</div>
            <div className="value mono accent">{resultado.extraTriple} hrs</div>
            <div className="label mono">{formatMXN(resultado.pagoTriple)}</div>
          </div>
        </div>

        {resultado.excedeLimiteLegal && (
          <div className="stat" style={{ marginTop: 14, borderColor: 'var(--danger)' }}>
            <div className="label">Excedente sobre el límite legal (&gt;60 hrs)</div>
            <div className="value warn mono">{resultado.excedente} hrs · {formatMXN(resultado.pagoExcedente)}</div>
          </div>
        )}

        <div className="stat" style={{ marginTop: 14, background: 'transparent', border: '1px solid var(--accent)' }}>
          <div className="label">Total a pagar esta semana</div>
          <div className="value accent mono" style={{ fontSize: '1.6rem' }}>{formatMXN(resultado.total_pago)}</div>
        </div>
      </div>
    </div>
  )
}
