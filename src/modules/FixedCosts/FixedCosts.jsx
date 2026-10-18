import { useState, useMemo } from 'react'
import { useConfirm } from '../../components/ConfirmDialog'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { formatMXN } from '../../utils/overtime'
import { formatShort, todayISO } from '../../utils/dates'

function calcularFijo(fijo) {
  // Se redondea a centavos para evitar errores de coma flotante (0.1 + 0.2).
  const aCentavos = (n) => Math.round(n * 100) / 100
  const pagado = aCentavos(fijo.pagos.reduce((a, p) => a + (Number(p.monto) || 0), 0))
  const pendiente = Math.max(0, aCentavos(fijo.montoTotal - pagado))
  const liquidada = pendiente === 0 && fijo.montoTotal > 0
  const avance = fijo.montoTotal > 0 ? Math.min(100, Math.round((pagado / fijo.montoTotal) * 100)) : 0
  return { pagado, pendiente, liquidada, avance }
}

function TarjetaFijo({ fijo, t, lang }) {
  const pedirConfirmacion = useConfirm()
  const { addPagoFijo, removePagoFijo, removeFijo, updateFijo } = useAppData()
  const [montoPago, setMontoPago] = useState('')
  const [fechaPago, setFechaPago] = useState(todayISO())
  const [verHistorial, setVerHistorial] = useState(false)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(fijo.nombre)
  const [montoTotal, setMontoTotal] = useState(String(fijo.montoTotal))
  const [comentario, setComentario] = useState(fijo.comentario || '')

  const { pagado, pendiente, liquidada, avance } = useMemo(() => calcularFijo(fijo), [fijo])

  function registrarPago(e) {
    e.preventDefault()
    const monto = Number(montoPago)
    if (!monto || monto <= 0) return
    addPagoFijo(fijo.id, monto, fechaPago)
    setMontoPago('')
  }

  function guardarEdicion(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    updateFijo(fijo.id, { nombre: nombre.trim(), montoTotal: Number(montoTotal) || 0, comentario: comentario.trim() })
    setEditando(false)
  }

  return (
    <div className="card" style={liquidada ? { opacity: 0.75 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {fijo.nombre}
            {liquidada && <span className="pill current">{t('fixed.settledPill')}</span>}
          </p>
          <p className="card-sub" style={{ marginBottom: 0 }}>
            {t('fixed.totalLabel')} {formatMXN(fijo.montoTotal)}
            {fijo.comentario ? ` · ${fijo.comentario}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setEditando((v) => !v)}>{editando ? t('common.close') : t('common.edit')}</button>
          <button className="btn danger" onClick={() => pedirConfirmacion(() => removeFijo(fijo.id))}>{t('common.delete')}</button>
        </div>
      </div>

      {editando && (
        <form onSubmit={guardarEdicion} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('common.name')}</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('fixed.totalAmount')}</label>
            <input type="number" min="0" step="0.01" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('common.comment')}</label>
            <input type="text" value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>
          <button type="submit" className="btn primary">{t('common.saveChanges')}</button>
        </form>
      )}

      <div style={{ margin: '12px 0' }}>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden', boxShadow: 'var(--shadow-inset)' }}>
          <div
            style={{
              height: '100%',
              width: `${avance}%`,
              background: liquidada ? 'var(--online)' : 'var(--accent)',
              transition: 'width .25s ease',
            }}
          />
        </div>
        <div className="card-sub" style={{ marginTop: 6, marginBottom: 0 }}>{avance}{t('fixed.paidPct')}</div>
      </div>

      <div className="grid cols-3">
        <div className="stat">
          <div className="label">{t('fixed.paid')}</div>
          <div className="value mono">{formatMXN(pagado)}</div>
        </div>
        <div className="stat" style={{ borderColor: liquidada ? 'var(--online)' : 'var(--accent)' }}>
          <div className="label">{t('fixed.remaining')}</div>
          <div className={`value mono ${liquidada ? '' : 'accent'}`}>{formatMXN(pendiente)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('fixed.paymentsCount')}</div>
          <div className="value mono">{fijo.pagos.length}</div>
        </div>
      </div>

      {!liquidada && (
        <form onSubmit={registrarPago} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('fixed.paymentAmount')}</label>
            <input type="number" min="0" step="0.01" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('common.date')}</label>
            <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
          </div>
          <button type="submit" className="btn primary">{t('fixed.addPayment')}</button>
        </form>
      )}

      {fijo.pagos.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setVerHistorial((v) => !v)}>
            {verHistorial ? t('fixed.hideHistory') : t('fixed.viewHistory')(fijo.pagos.length)}
          </button>
          {verHistorial && (
            <div style={{ marginTop: 8 }}>
              {[...fijo.pagos]
                .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                .map((p) => (
                  <div className="day-row" key={p.id}>
                    <div>
                      <div className="day-name mono">{formatMXN(p.monto)}</div>
                      <div className="day-date">{formatShort(p.fecha, lang)}</div>
                    </div>
                    <button className="btn danger" onClick={() => pedirConfirmacion(() => removePagoFijo(fijo.id, p.id))}>{t('common.remove')}</button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FixedCosts() {
  const { fijos, addFijo } = useAppData()
  const { t, lang } = useLanguage()
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [comentario, setComentario] = useState('')

  const calculadas = useMemo(() => fijos.map((d) => ({ ...d, ...calcularFijo(d) })), [fijos])
  const activas = calculadas.filter((d) => !d.liquidada)
  const liquidadas = calculadas.filter((d) => d.liquidada)

  const totalPagadoGlobal = calculadas.reduce((a, d) => a + d.pagado, 0)
  const totalPendienteGlobal = calculadas.reduce((a, d) => a + d.pendiente, 0)

  function crearFijo(e) {
    e.preventDefault()
    if (!nombre.trim() || !Number(monto)) return
    addFijo(nombre.trim(), monto, comentario.trim())
    setNombre('')
    setMonto('')
    setComentario('')
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">{t('fixed.globalSummary')}</p>
        <div className="grid cols-2">
          <div className="stat">
            <div className="label">{t('fixed.totalPaid')}</div>
            <div className="value mono">{formatMXN(totalPagadoGlobal)}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">{t('fixed.totalPending')}</div>
            <div className="value accent mono">{formatMXN(totalPendienteGlobal)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">{t('fixed.addDebt')}</p>
        <form onSubmit={crearFijo} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('common.name')}</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('fixed.namePlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label>{t('fixed.totalAmount')}</label>
            <input type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('common.comment')}</label>
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={t('fixed.commentPlaceholder')}
            />
          </div>
          <button type="submit" className="btn primary">{t('fixed.addDebtBtn')}</button>
        </form>
      </div>

      {activas.length === 0 && liquidadas.length === 0 && (
        <div className="card"><p className="empty">{t('fixed.empty')}</p></div>
      )}

      {activas.map((d) => <TarjetaFijo key={d.id} fijo={d} t={t} lang={lang} />)}

      {liquidadas.length > 0 && (
        <>
          <p className="card-sub" style={{ margin: '18px 4px 8px' }}>{t('fixed.settled')}</p>
          {liquidadas.map((d) => <TarjetaFijo key={d.id} fijo={d} t={t} lang={lang} />)}
        </>
      )}
    </div>
  )
}
