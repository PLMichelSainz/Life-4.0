import { useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { catorcenaDe, diasDeCatorcena } from '../../utils/payroll'
import { todayISO, formatShort, dayName } from '../../utils/dates'
import { formatMXN } from '../../utils/overtime'

const TARIFA_NORMAL = 11.0
const TARIFA_TRANSBORDO = 5.5

export default function TransportExpenses() {
  const { transporte, setTransporteDia } = useAppData()
  const hoy = todayISO()

  const catorcena = useMemo(() => catorcenaDe(hoy), [hoy])
  const dias = useMemo(() => diasDeCatorcena(catorcena.start), [catorcena.start])

  const totales = dias.reduce(
    (acc, fecha) => {
      const registro = transporte[fecha] || { normal: 0, transbordo: 0 }
      acc.normal += Number(registro.normal) || 0
      acc.transbordo += Number(registro.transbordo) || 0
      return acc
    },
    { normal: 0, transbordo: 0 }
  )
  const totalGasto = totales.normal * TARIFA_NORMAL + totales.transbordo * TARIFA_TRANSBORDO

  return (
    <div>
      <div className="card">
        <p className="card-title">Gasto acumulado — catorcena en curso</p>
        <p className="card-sub">
          {formatShort(catorcena.start)} – {formatShort(catorcena.end)} · se paga el {formatShort(catorcena.payDate)}
        </p>
        <div className="grid cols-3">
          <div className="stat">
            <div className="label">Camión normal ({formatMXN(TARIFA_NORMAL)})</div>
            <div className="value mono">{totales.normal}</div>
          </div>
          <div className="stat">
            <div className="label">Transbordo ({formatMXN(TARIFA_TRANSBORDO)})</div>
            <div className="value mono">{totales.transbordo}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">Total gastado</div>
            <div className="value accent mono">{formatMXN(totalGasto)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Registro diario</p>
        <p className="card-sub">Los días anteriores a hoy quedan bloqueados para evitar modificar registros pasados.</p>
        {dias.map((fecha) => {
          const bloqueado = fecha < hoy
          const registro = transporte[fecha] || { normal: 0, transbordo: 0 }
          const esHoy = fecha === hoy
          return (
            <div className={`day-row${bloqueado ? ' locked' : ''}`} key={fecha}>
              <div>
                <div className="day-name">
                  {dayName(fecha, true)}
                  {esHoy && <span className="pill current" style={{ marginLeft: 8 }}>hoy</span>}
                </div>
                <div className="day-date">{formatShort(fecha)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 90 }}>
                  <label>Normal</label>
                  <input
                    type="number"
                    min="0"
                    disabled={bloqueado}
                    value={registro.normal === 0 ? '' : registro.normal}
                    placeholder="0"
                    onChange={(e) => setTransporteDia(fecha, 'normal', Number(e.target.value) || 0)}
                  />
                </div>
                <div style={{ width: 90 }}>
                  <label>Transbordo</label>
                  <input
                    type="number"
                    min="0"
                    disabled={bloqueado}
                    value={registro.transbordo === 0 ? '' : registro.transbordo}
                    placeholder="0"
                    onChange={(e) => setTransporteDia(fecha, 'transbordo', Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
