import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { formatMXN } from '../../utils/overtime'
import { currentPeriod } from '../../utils/dates'

const TIPO_KEY = { credito: 'credito', debito: 'debito', cash: 'cash' }

function CuentaFila({ item, t, onUpdate, onRemove }) {
  const [editando, setEditando] = useState(false)
  const [concepto, setConcepto] = useState(item.concepto)
  const [monto, setMonto] = useState(String(item.monto))
  const [tipo, setTipo] = useState(item.tipo || 'debito')

  function guardar(e) {
    e.preventDefault()
    if (!concepto.trim()) return
    onUpdate(item.id, { concepto: concepto.trim(), monto: Number(monto) || 0, tipo })
    setEditando(false)
  }

  return (
    <div>
      <div className="day-row">
        <div>
          <div className="day-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.concepto}
            <span className="pill">
              {t(`budget.typeLabels.${TIPO_KEY[item.tipo] || 'debito'}`)}
            </span>
          </div>
          <div className="day-date">{formatMXN(item.monto)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setEditando((v) => !v)}>{editando ? t('common.close') : t('common.edit')}</button>
          <button className="btn danger" onClick={() => onRemove(item.id)}>{t('common.delete')}</button>
        </div>
      </div>
      {editando && (
        <form onSubmit={guardar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 0 12px' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('budget.concept')}</label>
            <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('budget.amount')}</label>
            <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div style={{ width: 130 }}>
            <label>{t('budget.type')}</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="credito">{t('budget.typeLabels.credito')}</option>
              <option value="debito">{t('budget.typeLabels.debito')}</option>
              <option value="cash">{t('budget.typeLabels.cash')}</option>
            </select>
          </div>
          <button type="submit" className="btn primary">{t('common.saveChanges')}</button>
        </form>
      )}
    </div>
  )
}

function IngresoFila({ item, t, onUpdate, onRemove }) {
  const [editando, setEditando] = useState(false)
  const [concepto, setConcepto] = useState(item.concepto)
  const [monto, setMonto] = useState(String(item.monto))

  function guardar(e) {
    e.preventDefault()
    if (!concepto.trim()) return
    onUpdate(item.id, { concepto: concepto.trim(), monto: Number(monto) || 0 })
    setEditando(false)
  }

  return (
    <div>
      <div className="day-row">
        <div>
          <div className="day-name">{item.concepto}</div>
          <div className="day-date">{formatMXN(item.monto)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setEditando((v) => !v)}>{editando ? t('common.close') : t('common.edit')}</button>
          <button className="btn danger" onClick={() => onRemove(item.id)}>{t('common.delete')}</button>
        </div>
      </div>
      {editando && (
        <form onSubmit={guardar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 0 12px' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('budget.concept')}</label>
            <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('budget.amount')}</label>
            <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <button type="submit" className="btn primary">{t('common.saveChanges')}</button>
        </form>
      )}
    </div>
  )
}

function GastoFijoFila({ gasto, t, periodo, onUpdate, onRemove, onPagar }) {
  const [editando, setEditando] = useState(false)
  const [concepto, setConcepto] = useState(gasto.concepto)
  const [monto, setMonto] = useState(String(gasto.monto))
  const [categoria, setCategoria] = useState(gasto.categoria || '')
  const [abono, setAbono] = useState('')

  const pagado = Math.min(gasto.monto, (gasto.pagos || {})[periodo] || 0)
  const pendiente = Math.max(0, gasto.monto - pagado)
  const liquidado = pendiente === 0 && gasto.monto > 0

  function guardar(e) {
    e.preventDefault()
    if (!concepto.trim()) return
    onUpdate(gasto.id, { concepto: concepto.trim(), monto: Number(monto) || 0, categoria: categoria.trim() })
    setEditando(false)
  }

  function registrarPago(e) {
    e.preventDefault()
    const valor = Number(abono)
    if (!valor || valor <= 0) return
    onPagar(gasto.id, valor)
    setAbono('')
  }

  return (
    <div className="card" style={liquidado ? { opacity: 0.75 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {gasto.concepto}
            {liquidado && <span className="pill current">{t('budget.fullyPaid')}</span>}
          </p>
          <p className="card-sub" style={{ marginBottom: 0 }}>
            {gasto.categoria || t('budget.uncategorized')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setEditando((v) => !v)}>{editando ? t('common.close') : t('common.edit')}</button>
          <button className="btn danger" onClick={() => onRemove(gasto.id)}>{t('common.delete')}</button>
        </div>
      </div>

      {editando && (
        <form onSubmit={guardar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('budget.concept')}</label>
            <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('budget.monthlyAmount')}</label>
            <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('budget.category')}</label>
            <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder={t('budget.categoryPlaceholder')} />
          </div>
          <button type="submit" className="btn primary">{t('common.saveChanges')}</button>
        </form>
      )}

      <div className="grid cols-3" style={{ marginTop: 12 }}>
        <div className="stat">
          <div className="label">{t('budget.monthlyAmount')}</div>
          <div className="value mono">{formatMXN(gasto.monto)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('budget.paidThisPeriod')}</div>
          <div className="value mono">{formatMXN(pagado)}</div>
        </div>
        <div className="stat" style={{ borderColor: liquidado ? 'var(--online)' : 'var(--accent)' }}>
          <div className="label">{t('budget.pendingThisPeriod')}</div>
          <div className={`value mono ${liquidado ? '' : 'accent'}`}>{formatMXN(pendiente)}</div>
        </div>
      </div>

      {!liquidado && (
        <form onSubmit={registrarPago} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('budget.paymentAmount')}</label>
            <input type="number" min="0" value={abono} onChange={(e) => setAbono(e.target.value)} placeholder="0.00" />
          </div>
          <button type="submit" className="btn primary">{t('budget.registerPayment')}</button>
        </form>
      )}
    </div>
  )
}

export default function Budget() {
  const {
    cuentas, addCuenta, updateCuenta, removeCuenta,
    ingresos, addIngreso, updateIngreso, removeIngreso,
    gastosFijos, addGastoFijo, updateGastoFijo, removeGastoFijo, pagarGastoFijo,
    productos,
  } = useAppData()
  const { t } = useLanguage()
  const periodo = currentPeriod()

  const [conceptoCuenta, setConceptoCuenta] = useState('')
  const [montoCuenta, setMontoCuenta] = useState('')
  const [tipoCuenta, setTipoCuenta] = useState('debito')

  const [conceptoIngreso, setConceptoIngreso] = useState('')
  const [montoIngreso, setMontoIngreso] = useState('')

  const [conceptoGasto, setConceptoGasto] = useState('')
  const [montoGasto, setMontoGasto] = useState('')
  const [categoriaGasto, setCategoriaGasto] = useState('')

  const disponibleAhora = useMemo(
    () => cuentas.filter((c) => c.tipo !== 'credito').reduce((a, c) => a + (Number(c.monto) || 0), 0),
    [cuentas]
  )
  const totalDineroActual = useMemo(() => cuentas.reduce((a, c) => a + (Number(c.monto) || 0), 0), [cuentas])
  const totalIngresos = useMemo(() => ingresos.reduce((a, i) => a + (Number(i.monto) || 0), 0), [ingresos])
  const totalMensualGastos = useMemo(() => gastosFijos.reduce((a, g) => a + (Number(g.monto) || 0), 0), [gastosFijos])

  const gastosConPendiente = useMemo(
    () =>
      gastosFijos.map((g) => {
        const pagado = Math.min(g.monto, (g.pagos || {})[periodo] || 0)
        return { ...g, pagado, pendiente: Math.max(0, g.monto - pagado) }
      }),
    [gastosFijos, periodo]
  )
  const totalPendienteGastos = gastosConPendiente.reduce((a, g) => a + g.pendiente, 0)

  const pendientePorCategoria = useMemo(() => {
    const mapa = {}
    gastosConPendiente.forEach((g) => {
      if (g.pendiente <= 0) return
      const cat = g.categoria || t('budget.uncategorized')
      mapa[cat] = (mapa[cat] || 0) + g.pendiente
    })
    return Object.entries(mapa).sort((a, b) => b[1] - a[1])
  }, [gastosConPendiente, t])

  const totalReposiciones = useMemo(
    () => productos.filter((p) => p.estado === 'necesito').reduce((a, p) => a + (Number(p.precio) || 0), 0),
    [productos]
  )

  const proyeccionMensual = totalIngresos - totalMensualGastos

  function crearCuenta(e) {
    e.preventDefault()
    if (!conceptoCuenta.trim()) return
    addCuenta(conceptoCuenta.trim(), montoCuenta, tipoCuenta)
    setConceptoCuenta('')
    setMontoCuenta('')
    setTipoCuenta('debito')
  }
  function crearIngreso(e) {
    e.preventDefault()
    if (!conceptoIngreso.trim()) return
    addIngreso(conceptoIngreso.trim(), montoIngreso)
    setConceptoIngreso('')
    setMontoIngreso('')
  }
  function crearGasto(e) {
    e.preventDefault()
    if (!conceptoGasto.trim()) return
    addGastoFijo(conceptoGasto.trim(), montoGasto, categoriaGasto.trim())
    setConceptoGasto('')
    setMontoGasto('')
    setCategoriaGasto('')
  }

  return (
    <div>
      {/* ---- Resumen principal ---- */}
      <div className="card ticket" style={{ borderColor: 'var(--accent)' }}>
        <p className="card-title">{t('budget.summaryTitle')}</p>
        <div className="grid cols-3">
          <div className="stat">
            <div className="label">{t('budget.availableNowTitle')}</div>
            <div className="value mono">{formatMXN(disponibleAhora)}</div>
          </div>
          <div className="stat">
            <div className="label">{t('budget.pendingExpensesTitle')}</div>
            <div className="value mono" style={{ color: totalPendienteGastos > 0 ? 'var(--danger)' : undefined }}>
              {formatMXN(totalPendienteGastos)}
            </div>
          </div>
          <div className="stat">
            <div className="label">{t('budget.restocksTitle')}</div>
            <div className="value mono">{formatMXN(totalReposiciones)}</div>
          </div>
        </div>

        <div className="stat" style={{ marginTop: 14, background: 'transparent', border: '1px solid var(--accent)' }}>
          <div className="label">{t('budget.monthlyProjectionTitle')}</div>
          <div className="value accent mono" style={{ fontSize: '1.4rem' }}>{formatMXN(proyeccionMensual)}</div>
          <p className="card-sub" style={{ marginTop: 6, marginBottom: 0 }}>{t('budget.monthlyProjectionDesc')}</p>
        </div>

        {pendientePorCategoria.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p className="card-sub" style={{ marginBottom: 6 }}>{t('budget.pendingByCategory')}</p>
            {pendientePorCategoria.map(([cat, monto]) => (
              <div className="day-row" key={cat}>
                <div className="day-name">{cat}</div>
                <div className="value mono" style={{ fontSize: '0.9rem' }}>{formatMXN(monto)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Dinero actual ---- */}
      <div className="card">
        <p className="card-title">{t('budget.currentMoneyTitle')}</p>
        <p className="card-sub">{t('budget.currentMoneyDesc')} {t('budget.availableNowDesc')}</p>
        <div className="stat" style={{ marginBottom: 14, borderColor: 'var(--accent)' }}>
          <div className="label">{t('budget.totalCurrentMoney')}</div>
          <div className="value accent mono">{formatMXN(totalDineroActual)}</div>
        </div>

        {cuentas.length === 0 && <p className="empty">{t('budget.emptyAccounts')}</p>}
        {cuentas.map((c) => (
          <CuentaFila key={c.id} item={c} t={t} onUpdate={updateCuenta} onRemove={removeCuenta} />
        ))}

        <form onSubmit={crearCuenta} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('budget.concept')}</label>
            <input type="text" value={conceptoCuenta} onChange={(e) => setConceptoCuenta(e.target.value)} placeholder={t('budget.conceptPlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('budget.amount')}</label>
            <input type="number" min="0" value={montoCuenta} onChange={(e) => setMontoCuenta(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ width: 130 }}>
            <label>{t('budget.type')}</label>
            <select value={tipoCuenta} onChange={(e) => setTipoCuenta(e.target.value)}>
              <option value="credito">{t('budget.typeLabels.credito')}</option>
              <option value="debito">{t('budget.typeLabels.debito')}</option>
              <option value="cash">{t('budget.typeLabels.cash')}</option>
            </select>
          </div>
          <button type="submit" className="btn primary">{t('budget.addAccount')}</button>
        </form>
      </div>

      {/* ---- Ingresos ---- */}
      <div className="card">
        <p className="card-title">{t('budget.incomeTitle')}</p>
        <p className="card-sub">{t('budget.incomeDesc')}</p>
        <div className="stat" style={{ marginBottom: 14, borderColor: 'var(--accent)' }}>
          <div className="label">{t('budget.totalIncome')}</div>
          <div className="value accent mono">{formatMXN(totalIngresos)}</div>
        </div>

        {ingresos.length === 0 && <p className="empty">{t('budget.emptyIncome')}</p>}
        {ingresos.map((i) => (
          <IngresoFila key={i.id} item={i} t={t} onUpdate={updateIngreso} onRemove={removeIngreso} />
        ))}

        <form onSubmit={crearIngreso} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('budget.concept')}</label>
            <input type="text" value={conceptoIngreso} onChange={(e) => setConceptoIngreso(e.target.value)} placeholder={t('budget.incomePlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('budget.amount')}</label>
            <input type="number" min="0" value={montoIngreso} onChange={(e) => setMontoIngreso(e.target.value)} placeholder="0.00" />
          </div>
          <button type="submit" className="btn primary">{t('budget.addIncome')}</button>
        </form>
      </div>

      {/* ---- Gastos fijos ---- */}
      <div className="card">
        <p className="card-title">{t('budget.fixedExpensesTitle')}</p>
        <p className="card-sub">{t('budget.fixedExpensesDesc')}</p>
        <form onSubmit={crearGasto} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('budget.concept')}</label>
            <input type="text" value={conceptoGasto} onChange={(e) => setConceptoGasto(e.target.value)} placeholder={t('budget.expensePlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('budget.monthlyAmount')}</label>
            <input type="number" min="0" value={montoGasto} onChange={(e) => setMontoGasto(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>{t('budget.category')}</label>
            <input type="text" value={categoriaGasto} onChange={(e) => setCategoriaGasto(e.target.value)} placeholder={t('budget.categoryPlaceholder')} />
          </div>
          <button type="submit" className="btn primary">{t('budget.addExpense')}</button>
        </form>
      </div>

      {gastosFijos.length === 0 && (
        <div className="card"><p className="empty">{t('budget.emptyExpenses')}</p></div>
      )}
      {gastosConPendiente.map((g) => (
        <GastoFijoFila key={g.id} gasto={g} t={t} periodo={periodo} onUpdate={updateGastoFijo} onRemove={removeGastoFijo} onPagar={(id, monto) => pagarGastoFijo(id, monto, periodo)} />
      ))}
    </div>
  )
}
