import { useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { catorcenaDe, diasDeCatorcena, esViernesDePago } from '../../utils/payroll'
import { todayISO, formatShort, dayName } from '../../utils/dates'
import { formatMXN, calcularRecarga } from '../../utils/overtime'

const TARIFA_NORMAL = 11.0
const TARIFA_TRANSBORDO = 5.5
const COMISION_PCT = 0.03

export default function TransportExpenses() {
  const { transporte, setTransporteDia, tarjetaSaldo, setTarjetaSaldo } = useAppData()
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

  const falta = Math.max(0, totalGasto - (Number(tarjetaSaldo) || 0))
  const recarga = calcularRecarga(falta, COMISION_PCT)

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
            <div className="label">Total necesario</div>
            <div className="value accent mono">{formatMXN(totalGasto)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Recarga de tarjeta</p>
        <p className="card-sub">Considera una comisión del {(COMISION_PCT * 100).toFixed(0)}% por recarga.</p>

        <div style={{ maxWidth: 220, marginBottom: 14 }}>
          <label>Saldo actual en la tarjeta</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tarjetaSaldo === 0 ? '' : tarjetaSaldo}
            placeholder="0.00"
            onChange={(e) => setTarjetaSaldo(Number(e.target.value) || 0)}
          />
        </div>

        <div className="grid cols-2">
          <div className="stat">
            <div className="label">Falta por cubrir</div>
            <div className="value mono">{formatMXN(falta)}</div>
          </div>
          <div className="stat" style={{ borderColor: falta > 0 ? 'var(--accent)' : 'var(--border-soft)' }}>
            <div className="label">Monto a transferir (incluye comisión)</div>
            <div className={`value mono ${falta > 0 ? 'accent' : ''}`}>{formatMXN(recarga.montoTransferir)}</div>
          </div>
        </div>

        {falta > 0 && (
          <div className="grid cols-2" style={{ marginTop: 10 }}>
            <div className="stat">
              <div className="label">Comisión ({(COMISION_PCT * 100).toFixed(0)}%)</div>
              <div className="value mono">{formatMXN(recarga.comision)}</div>
            </div>
            <div className="stat">
              <div className="label">Quedará recargado después de comisión</div>
              <div className="value mono">{formatMXN(recarga.quedaRecargado)}</div>
            </div>
          </div>
        )}

        {falta === 0 && (
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Tu saldo actual ya cubre el total necesario de la catorcena. No necesitas recargar.
          </p>
        )}
      </div>

      <div className="card">
        <p className="card-title">Registro diario</p>
        <p className="card-sub">Los días anteriores a hoy quedan bloqueados para evitar modificar registros pasados. El viernes marcado como "pago" es catorcenal.</p>
        {dias.map((fecha) => {
          const bloqueado = fecha < hoy
          const registro = transporte[fecha] || { normal: 0, transbordo: 0 }
          const esHoy = fecha === hoy
          const esPago = esViernesDePago(fecha)
          return (
            <div className={`day-row${bloqueado ? ' locked' : ''}`} key={fecha}>
              <div>
                <div className="day-name">
                  {dayName(fecha, true)}
                  {esHoy && <span className="pill current" style={{ marginLeft: 8 }}>hoy</span>}
                  {esPago && (
                    <span className="pill" style={{ marginLeft: 8, color: 'var(--online)', borderColor: 'var(--online)' }}>
                      pago
                    </span>
                  )}
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
