import { useEffect, useMemo, useState } from 'react'
import DraftNumber from '../../components/DraftNumber'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { quincenaPorIndice, indiceQuincena, diasDeQuincena } from '../../utils/payroll'
import { DESCANSOS_POR_SEMANA } from '../../utils/config'
import { translations } from '../../i18n/translations'
import { todayISO, formatShort, dayName, parseISODate } from '../../utils/dates'
import { formatMXN, calcularRecarga } from '../../utils/overtime'

const TARIFA_NORMAL = 11.0
const TARIFA_TRANSBORDO = 5.5
const COMISION_PCT = 0.03

// Valor "efectivo" de un día: los días futuros u hoy respetan lo que el
// usuario capturó (o el default configurado si no lo ha tocado). Un día que
// YA TRANSCURRIÓ siempre se muestra y se cuenta como 0, sin importar si se
// había capturado algo antes de que terminara, para no seguir inflando el
// total ni el cálculo de recarga con días que ya pasaron.
function valorEfectivoDia(registroExplicito, campo, hoy, fecha, defaults, descanso = false) {
  if (descanso || fecha < hoy) return 0
  if (registroExplicito) return Number(registroExplicito[campo]) || 0
  return Number(defaults[campo]) || 0
}

export default function TransportExpenses() {
  const {
    transporte, setTransporteDia, transporteDefault, setTransporteDefault, tarjetaSaldo, setTarjetaSaldo,
    descansoPatron, setDescansoPatron, descansoExcepciones, setDescansoDia,
  } = useAppData()
  const { t, lang } = useLanguage()
  const hoy = todayISO()
  const [indice, setIndice] = useState(indiceQuincena(hoy))

  const [defNormal, setDefNormal] = useState(String(transporteDefault.normal))
  const [defTransbordo, setDefTransbordo] = useState(String(transporteDefault.transbordo))

  const quincena = useMemo(() => quincenaPorIndice(indice), [indice])
  const esActual = quincena.index === indiceQuincena(hoy)
  const dias = useMemo(() => diasDeQuincena(quincena.start, quincena.end), [quincena.start, quincena.end])

  // Descanso: la excepción del día manda; si no hay, aplica el patrón semanal (0=domingo..6=sábado).
  const patron = Array.isArray(descansoPatron) ? descansoPatron : []
  const porPatron = (fecha) => patron.includes(parseISODate(fecha).getDay())
  const esDescanso = (fecha) =>
    Object.prototype.hasOwnProperty.call(descansoExcepciones || {}, fecha) ? !!descansoExcepciones[fecha] : porPatron(fecha)
  const diasSemanaCortos = (translations[lang] || translations.es).days.short

  function alternarPatron(dia) {
    setDescansoPatron(patron.includes(dia) ? patron.filter((d) => d !== dia) : [...patron, dia].sort())
  }
  function marcarDescanso(fecha, marcado) {
    // Si coincide con lo que dicta el patrón, se quita la excepción para no acumular basura.
    setDescansoDia(fecha, marcado === porPatron(fecha) ? null : marcado)
  }

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
      acc.normal += valorEfectivoDia(registro, 'normal', hoy, fecha, transporteDefault, esDescanso(fecha))
      acc.transbordo += valorEfectivoDia(registro, 'transbordo', hoy, fecha, transporteDefault, esDescanso(fecha))
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
        <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {t('transport.accumulated')}
          <span className="pill current">{esActual ? t('transport.currentPeriod') : t('transport.period')}</span>
        </p>
        <p className="card-sub">
          {formatShort(quincena.start, lang)} – {formatShort(quincena.end, lang)} · {t('transport.daysCount')(quincena.dias)} · {t('transport.paidOn')} {formatShort(quincena.payDate, lang)} · {t('transport.nextPay')} {formatShort(quincena.siguientePago, lang)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button className="btn" onClick={() => setIndice((k) => k - 1)}>{t('transport.prevPeriod')}</button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={() => setIndice((k) => k + 1)}>{t('transport.nextPeriod')}</button>
        </div>
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
        <p className="card-title">{t('transport.restTitle')}</p>
        <p className="card-sub">{t('transport.restDesc')(DESCANSOS_POR_SEMANA)}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <button
              type="button"
              key={d}
              className={`btn${patron.includes(d) ? ' primary' : ''}`}
              aria-pressed={patron.includes(d)}
              onClick={() => alternarPatron(d)}
            >
              {diasSemanaCortos[d]}
            </button>
          ))}
        </div>
        {patron.length > 0 && patron.length !== DESCANSOS_POR_SEMANA && (
          <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
            {t('transport.restPickHint')(DESCANSOS_POR_SEMANA)}
          </p>
        )}
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
          <DraftNumber
            min="0"
            step="0.01"
            value={tarjetaSaldo}
            placeholder="0.00"
            onCommit={(n) => setTarjetaSaldo(n)}
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
              <div className="label">
                {recarga.tipoComision === 'fija'
                  ? ({ en: 'Commission ($8 flat)', fr: 'Frais ($8 fixes)' }[lang] || 'Comisión ($8 fija)')
                  : t('transport.commission')((COMISION_PCT * 100).toFixed(0))}
              </div>
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
        <p className="card-title">{t('transport.dailyLog')} · v2026-11-10-B</p>
        <p className="card-sub">{t('transport.dailyLogDesc')}</p>
        {dias.map((fecha) => {
          const bloqueado = fecha < hoy
          const registro = transporte[fecha]
          const descanso = esDescanso(fecha)
          const normalMostrado = valorEfectivoDia(registro, 'normal', hoy, fecha, transporteDefault, descanso)
          const transbordoMostrado = valorEfectivoDia(registro, 'transbordo', hoy, fecha, transporteDefault, descanso)
          const esHoy = fecha === hoy
          const esPago = fecha === quincena.payDate
          return (
            <div className={`day-row${bloqueado || descanso ? ' locked' : ''}${esPago ? ' payday' : ''}`} key={fecha}>
              <div>
                <div className="day-name">
                  {dayName(fecha, true, lang)}
                  {esHoy && <span className="pill current" style={{ marginLeft: 8 }}>{t('common.today')}</span>}
                  {descanso && (
                    <span className="pill" style={{ marginLeft: 8 }}>{t('transport.restBadge')}</span>
                  )}
                  {esPago && (
                    <span className="pill" style={{ marginLeft: 8, color: 'var(--online)', borderColor: 'var(--online)' }}>
                      {t('common.payday')}
                    </span>
                  )}
                </div>
                <div className="day-date">{formatShort(fecha, lang)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: 1 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={descanso}
                    disabled={bloqueado}
                    onChange={(e) => marcarDescanso(fecha, e.target.checked)}
                  />
                  {t('transport.restDay')}
                </label>
                <div style={{ width: 90 }}>
                  <label>{t('transport.normal')}</label>
                  <DraftNumber
                    min="0"
                    disabled={bloqueado || descanso}
                    value={normalMostrado}
                    placeholder="0"
                    onCommit={(n) => setTransporteDia(fecha, 'normal', n)}
                  />
                </div>
                <div style={{ width: 90 }}>
                  <label>{t('transport.transfer2')}</label>
                  <DraftNumber
                    min="0"
                    disabled={bloqueado || descanso}
                    value={transbordoMostrado}
                    placeholder="0"
                    onCommit={(n) => setTransporteDia(fecha, 'transbordo', n)}
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
