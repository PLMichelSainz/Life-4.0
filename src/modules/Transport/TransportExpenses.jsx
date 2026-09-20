import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { catorcenaDe, diasDeCatorcena, esViernesDePago } from '../../utils/payroll'
import { todayISO, formatShort, dayName } from '../../utils/dates'
import { formatMXN, calcularRecarga } from '../../utils/overtime'

const TARIFA_NORMAL = 11.0
const TARIFA_TRANSBORDO = 5.5
const COMISION_PCT = 0.03

// Valor "efectivo" de un día: los días futuros u hoy respetan lo que el
// usuario capturó (o el default configurado si no lo ha tocado). Un día que
// YA TRANSCURRIÓ siempre se muestra y se cuenta como 0, sin importar si se
// había capturado algo antes de que terminara, para no seguir inflando el
// total ni el cálculo de recarga con días que ya pasaron.
function valorEfectivoDia(registroExplicito, campo, hoy, fecha, defaults) {
  if (fecha < hoy) return 0
  if (registroExplicito) return Number(registroExplicito[campo]) || 0
  return Number(defaults[campo]) || 0
}

export default function TransportExpenses() {
  const { transporte, setTransporteDia, transporteDefault, setTransporteDefault, tarjetaSaldo, setTarjetaSaldo } =
    useAppData()
  const { t, lang } = useLanguage()
  const hoy = todayISO()

  // eslint-disable-next-line no-console
  console.log('[TransportExpenses] version-check-2026-09-20b, hoy=', hoy)

  const [defNormal, setDefNormal] = useState(String(transporteDefault.normal))
  const [defTransbordo, setDefTransbordo] = useState(String(transporteDefault.transbordo))

  const catorcena = useMemo(() => catorcenaDe(hoy), [hoy])
  const dias = useMemo(() => diasDeCatorcena(catorcena.start), [catorcena.start])

  // Cuando un día ya transcurrió, se guarda (persiste) en 0 de verdad, no solo
  // se muestra en 0. Así el dato queda "bloqueado en 0" en la nube/local aunque
  // ese día se hubiera capturado algo antes de terminar.
  useEffect(() => {
    dias.forEach((fecha) => {
      if (fecha >= hoy) return
      const registro = transporte[fecha]
      if (!registro) return
      if ((Number(registro.normal) || 0) !== 0) setTransporteDia(fecha, 'normal', 0)
      if ((Number(registro.transbordo) || 0) !== 0) setTransporteDia(fecha, 'transbordo', 0)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias, hoy, transporte])

  const totales = dias.reduce(
    (acc, fecha) => {
      const registro = transporte[fecha]
      acc.normal += valorEfectivoDia(registro, 'normal', hoy, fecha, transporteDefault)
      acc.transbordo += valorEfectivoDia(registro, 'transbordo', hoy, fecha, transporteDefault)
      return acc
    },
    { normal: 0, transbordo: 0 }
  )
  const totalGasto = totales.normal * TARIFA_NORMAL + totales.transbordo * TARIFA_TRANSBORDO

  const falta = Math.max(0, totalGasto - (Number(tarjetaSaldo) || 0))
  const recarga = calcularRecarga(falta, COMISION_PCT)

  function guardarDefaults(e) {
    e.preventDefault()
    setTransporteDefault({
      normal: Math.max(0, Number(defNormal) || 0),
      transbordo: Math.max(0, Number(defTransbordo) || 0),
    })
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">{t('transport.accumulated')}</p>
        <p className="card-sub">
          {formatShort(catorcena.start, lang)} – {formatShort(catorcena.end, lang)} · {t('transport.paidOn')} {formatShort(catorcena.payDate, lang)}
        </p>
        <div className="grid cols-3">
          <div className="stat">
            <div className="label">{t('transport.normalBus')(formatMXN(TARIFA_NORMAL))}</div>
            <div className="value mono">{totales.normal}</div>
          </div>
          <div className="stat">
            <div className="label">{t('transport.transfer')(formatMXN(TARIFA_TRANSBORDO))}</div>
            <div className="value mono">{totales.transbordo}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">{t('transport.totalNeeded')}</div>
            <div className="value accent mono">{formatMXN(totalGasto)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">{t('transport.defaultTitle')}</p>
        <p className="card-sub">{t('transport.defaultDesc')}</p>
        <form onSubmit={guardarDefaults} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 130 }}>
            <label>{t('transport.busesPerDay')}</label>
            <input type="number" min="0" value={defNormal} onChange={(e) => setDefNormal(e.target.value)} />
          </div>
          <div style={{ width: 130 }}>
            <label>{t('transport.transfersPerDay')}</label>
            <input type="number" min="0" value={defTransbordo} onChange={(e) => setDefTransbordo(e.target.value)} />
          </div>
          <button type="submit" className="btn primary">{t('common.save')}</button>
        </form>
      </div>

      <div className="card">
        <p className="card-title">{t('transport.rechargeTitle')}</p>
        <p className="card-sub">{t('transport.rechargeDesc')((COMISION_PCT * 100).toFixed(0))}</p>

        <div style={{ maxWidth: 220, marginBottom: 14 }}>
          <label>{t('transport.currentBalance')}</label>
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
            <div className="label">{t('transport.missing')}</div>
            <div className="value mono">{formatMXN(falta)}</div>
          </div>
          <div className="stat">
            <div className="label">{t('transport.amountToTransfer')}</div>
            <div className="value mono">{formatMXN(recarga.montoTransferir)}</div>
          </div>
        </div>

        {falta > 0 && (
          <div className="grid cols-2" style={{ marginTop: 10 }}>
            <div className="stat">
              <div className="label">{t('transport.commission')((COMISION_PCT * 100).toFixed(0))}</div>
              <div className="value mono">{formatMXN(recarga.comision)}</div>
            </div>
            <div className="stat" style={{ borderColor: 'var(--accent)' }}>
              <div className="label">{t('transport.leftAfterCommission')}</div>
              <div className="value accent mono">{formatMXN(recarga.quedaRecargado)}</div>
            </div>
          </div>
        )}

        {falta === 0 && (
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            {t('transport.alreadyCovered')}
          </p>
        )}
      </div>

      <div className="card">
        <p className="card-title">{t('transport.dailyLog')}</p>
        <p className="card-sub">{t('transport.dailyLogDesc')}</p>
        {dias.map((fecha) => {
          const bloqueado = fecha < hoy
          const registro = transporte[fecha]
          const normalMostrado = bloqueado ? 0 : valorEfectivoDia(registro, 'normal', hoy, fecha, transporteDefault)
          const transbordoMostrado = bloqueado ? 0 : valorEfectivoDia(registro, 'transbordo', hoy, fecha, transporteDefault)
          const esHoy = fecha === hoy
          const esPago = esViernesDePago(fecha)
          return (
            <div className={`day-row${bloqueado ? ' locked' : ''}`} key={fecha}>
              <div>
                <div className="day-name">
                  {dayName(fecha, true, lang)}
                  {esHoy && <span className="pill current" style={{ marginLeft: 8 }}>{t('common.today')}</span>}
                  {esPago && (
                    <span className="pill" style={{ marginLeft: 8, color: 'var(--online)', borderColor: 'var(--online)' }}>
                      {t('common.payday')}
                    </span>
                  )}
                  {bloqueado && registro && (Number(registro.normal) || Number(registro.transbordo)) ? (
                    <span style={{ marginLeft: 8, fontSize: '0.65rem', color: 'var(--danger)' }}>
                      (guardado: {registro.normal ?? 0}/{registro.transbordo ?? 0})
                    </span>
                  ) : null}
                </div>
                <div className="day-date">{formatShort(fecha, lang)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 90 }}>
                  <label>{t('transport.normal')}</label>
                  <input
                    type="number"
                    min="0"
                    disabled={bloqueado}
                    value={normalMostrado === 0 ? '' : normalMostrado}
                    placeholder="0"
                    onChange={(e) => setTransporteDia(fecha, 'normal', Number(e.target.value) || 0)}
                  />
                </div>
                <div style={{ width: 90 }}>
                  <label>{t('transport.transfer2')}</label>
                  <input
                    type="number"
                    min="0"
                    disabled={bloqueado}
                    value={transbordoMostrado === 0 ? '' : transbordoMostrado}
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
