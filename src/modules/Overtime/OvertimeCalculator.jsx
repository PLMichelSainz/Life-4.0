import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { addDays, formatShort, formatLong, todayISO } from '../../utils/dates'
import { calcularSemana, formatMXN, LIMITE_LEGAL_SEMANAL } from '../../utils/overtime'
import { indiceCatorcena, catorcenaPorIndice } from '../../utils/payroll'

const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function BloqueSemana({ titulo, weekStart, horas, onChange, resultado }) {
  return (
    <div className="card">
      <p className="card-title">{titulo}</p>
      <p className="card-sub">
        {formatShort(weekStart)} – {formatShort(addDays(weekStart, 6))} · jornada ordinaria de referencia: {resultado.jornadaOrdinaria} hrs
      </p>

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
              onChange={(e) => onChange(i, Number(e.target.value) || 0)}
            />
          </div>
        )
      })}

      <div className="grid cols-3" style={{ marginTop: 14 }}>
        <div className="stat">
          <div className="label">Ordinarias ({LIMITE_LEGAL_SEMANAL} hrs tope)</div>
          <div className="value mono">{resultado.ordinarias} hrs</div>
          <div className="label mono">{formatMXN(resultado.pagoOrdinario)}</div>
        </div>
        <div className="stat">
          <div className="label">Doble (49–57)</div>
          <div className="value mono accent">{resultado.extraDoble} hrs</div>
          <div className="label mono">{formatMXN(resultado.pagoDoble)}</div>
        </div>
        <div className="stat">
          <div className="label">Triple (58–60)</div>
          <div className="value mono accent">{resultado.extraTriple} hrs</div>
          <div className="label mono">{formatMXN(resultado.pagoTriple)}</div>
        </div>
      </div>

      {resultado.excedeLimiteLegal && (
        <div className="stat" style={{ marginTop: 14, borderColor: 'var(--danger)' }}>
          <div className="label">Excedente sobre el límite legal (&gt;60 hrs esta semana)</div>
          <div className="value warn mono">{resultado.excedente} hrs · {formatMXN(resultado.pagoExcedente)}</div>
        </div>
      )}

      <div className="stat" style={{ marginTop: 14, background: 'transparent', border: '1px solid var(--accent)' }}>
        <div className="label">Total de la semana</div>
        <div className="value accent mono" style={{ fontSize: '1.3rem' }}>{formatMXN(resultado.total_pago)}</div>
      </div>
    </div>
  )
}

export default function OvertimeCalculator() {
  const { horasPorSemana, setHorasDia } = useAppData()
  const hoy = todayISO()
  const [indice, setIndice] = useState(indiceCatorcena(hoy))

  const catorcena = useMemo(() => catorcenaPorIndice(indice), [indice])
  const week1Start = catorcena.start
  const week2Start = addDays(catorcena.start, 7)

  const horas1 = horasPorSemana[week1Start] || [0, 0, 0, 0, 0, 0, 0]
  const horas2 = horasPorSemana[week2Start] || [0, 0, 0, 0, 0, 0, 0]

  const resultado1 = useMemo(() => calcularSemana(horas1, week1Start), [horas1, week1Start])
  const resultado2 = useMemo(() => calcularSemana(horas2, week2Start), [horas2, week2Start])

  const totalCatorcena = resultado1.total_pago + resultado2.total_pago
  const totalHoras = resultado1.total + resultado2.total

  return (
    <div>
      <div className="card ticket" style={{ borderColor: 'var(--accent)' }}>
        <p className="pill current">{catorcena.index === indiceCatorcena(hoy) ? 'Catorcena en curso' : 'Catorcena'}</p>
        <h2 className="display" style={{ margin: '10px 0 2px' }}>
          {formatShort(catorcena.start)} – {formatShort(catorcena.end)}
        </h2>
        <p className="card-sub" style={{ marginBottom: 14 }}>Se paga el {formatLong(catorcena.payDate)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => setIndice((k) => k - 1)}>‹ Catorcena anterior</button>
          <div className="grid cols-2" style={{ flex: 1 }}>
            <div className="stat">
              <div className="label">Horas totales</div>
              <div className="value mono">{totalHoras} hrs</div>
            </div>
            <div className="stat" style={{ borderColor: 'var(--accent)' }}>
              <div className="label">Total a pagar (catorcena)</div>
              <div className="value accent mono">{formatMXN(totalCatorcena)}</div>
            </div>
          </div>
          <button className="btn" onClick={() => setIndice((k) => k + 1)}>Siguiente ›</button>
        </div>
      </div>

      <BloqueSemana
        titulo="Semana 1"
        weekStart={week1Start}
        horas={horas1}
        resultado={resultado1}
        onChange={(i, v) => setHorasDia(week1Start, i, v)}
      />
      <BloqueSemana
        titulo="Semana 2"
        weekStart={week2Start}
        horas={horas2}
        resultado={resultado2}
        onChange={(i, v) => setHorasDia(week2Start, i, v)}
      />
    </div>
  )
}
