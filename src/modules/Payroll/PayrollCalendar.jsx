import { useMemo } from 'react'
import { listaCatorcenas } from '../../utils/payroll'
import { todayISO, formatShort, formatLong } from '../../utils/dates'

export default function PayrollCalendar() {
  const hoy = todayISO()
  const catorcenas = useMemo(() => listaCatorcenas(hoy, 2, 4), [hoy])
  const actual = catorcenas.find((c) => c.esActual)

  return (
    <div>
      <div className="card ticket" style={{ borderColor: 'var(--accent)' }}>
        <p className="pill current">Catorcena en curso</p>
        <h2 className="display" style={{ margin: '10px 0 2px' }}>
          {formatShort(actual.start)} – {formatShort(actual.end)}
        </h2>
        <p className="card-sub" style={{ marginBottom: 0 }}>
          Día de pago: <b>{formatLong(actual.payDate)}</b>
        </p>
      </div>

      <div className="card">
        <p className="card-title">Próximas y anteriores catorcenas</p>
        <p className="card-sub">Calculadas a partir de la fecha de referencia: viernes 14 de agosto de 2026.</p>
        {catorcenas.map((c) => (
          <div className="day-row" key={c.index}>
            <div>
              <div className="day-name">
                {formatShort(c.start)} – {formatShort(c.end)}
                {c.esActual && <span className="pill current" style={{ marginLeft: 8 }}>actual</span>}
              </div>
              <div className="day-date">Pago: {formatLong(c.payDate)}</div>
            </div>
            <span className="pill mono">#{c.index}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
