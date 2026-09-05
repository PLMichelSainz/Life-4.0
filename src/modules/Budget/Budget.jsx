import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { formatMXN } from '../../utils/overtime'

function Fila({ item, t, onUpdate, onRemove }) {
  const [editando, setEditando] = useState(false)
  const [concepto, setConcepto] = useState(item.concepto)
  const [monto, setMonto] = useState(String(item.monto))
  const [tipo, setTipo] = useState(item.tipo || 'debito')

  function guardar(e) {
    e.preventDefault()
    if (!concepto.trim()) return
    onUpdate(item.id, { concepto: concepto.trim(), monto: Number(monto) || 0, ...(item.tipo !== undefined ? { tipo } : {}) })
    setEditando(false)
  }

  return (
    <div>
      <div className="day-row">
        <div>
          <div className="day-name">{item.concepto}</div>
          <div className="day-date">
            {formatMXN(item.monto)}
            {item.tipo ? ` · ${t(`budget.type${item.tipo.charAt(0).toUpperCase()}${item.tipo.slice(1)}`)}` : ''}
          </div>
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
          {item.tipo !== undefined && (
            <div style={{ width: 130 }}>
              <label>{t('budget.type')}</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="credito">{t('budget.typeCredit')}</option>
                <option value="debito">{t('budget.typeDebit')}</option>
                <option value="cash">{t('budget.typeCash')}</option>
              </select>
            </div>
          )}
          <button type="submit" className="btn primary">{t('common.saveChanges')}</button>
        </form>
      )}
    </div>
  )
}

function Seccion({ titulo, desc, totalLabel, total, items, onAdd, onUpdate, onRemove, t, conConceptoPlaceholder, conTipo, emptyMsg }) {
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [tipo, setTipo] = useState('debito')

  function submit(e) {
    e.preventDefault()
    if (!concepto.trim()) return
    if (conTipo) onAdd(concepto.trim(), monto, tipo)
    else onAdd(concepto.trim(), monto)
    setConcepto('')
    setMonto('')
    setTipo('debito')
  }

  return (
    <div className="card">
      <p className="card-title">{titulo}</p>
      <p className="card-sub">{desc}</p>
      <div className="stat" style={{ marginBottom: 14, borderColor: 'var(--accent)' }}>
        <div className="label">{totalLabel}</div>
        <div className="value accent mono">{formatMXN(total)}</div>
      </div>

      {items.length === 0 && <p className="empty">{emptyMsg}</p>}
      {items.map((it) => (
        <Fila key={it.id} item={it} t={t} onUpdate={onUpdate} onRemove={onRemove} />
      ))}

      <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 12 }}>
        <div style={{ flex: 2, minWidth: 160 }}>
          <label>{t('budget.concept')}</label>
          <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder={conConceptoPlaceholder} />
        </div>
        <div style={{ flex: 1, minWidth: 110 }}>
          <label>{t('budget.amount')}</label>
          <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
        </div>
        {conTipo && (
          <div style={{ width: 130 }}>
            <label>{t('budget.type')}</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="credito">{t('budget.typeCredit')}</option>
              <option value="debito">{t('budget.typeDebit')}</option>
              <option value="cash">{t('budget.typeCash')}</option>
            </select>
          </div>
        )}
        <button type="submit" className="btn primary">{t('common.add')}</button>
      </form>
    </div>
  )
}

export default function Budget() {
  const {
    cuentas, addCuenta, updateCuenta, removeCuenta,
    ingresos, addIngreso, updateIngreso, removeIngreso,
    gastosFijos, addGastoFijo, updateGastoFijo, removeGastoFijo,
  } = useAppData()
  const { t } = useLanguage()

  const totalDineroActual = useMemo(() => cuentas.reduce((a, c) => a + (Number(c.monto) || 0), 0), [cuentas])
  const totalIngresos = useMemo(() => ingresos.reduce((a, i) => a + (Number(i.monto) || 0), 0), [ingresos])
  const totalGastosFijos = useMemo(() => gastosFijos.reduce((a, g) => a + (Number(g.monto) || 0), 0), [gastosFijos])
  const dineroLibre = totalIngresos - totalGastosFijos

  return (
    <div>
      <div className="card">
        <p className="card-title">{t('budget.summaryTitle')}</p>
        <div className="grid cols-3">
          <div className="stat">
            <div className="label">{t('budget.totalIncome')}</div>
            <div className="value mono">{formatMXN(totalIngresos)}</div>
          </div>
          <div className="stat">
            <div className="label">{t('budget.totalFixedExpenses')}</div>
            <div className="value mono" style={{ color: 'var(--danger)' }}>{formatMXN(totalGastosFijos)}</div>
          </div>
          <div className="stat" style={{ borderColor: dineroLibre >= 0 ? 'var(--online)' : 'var(--danger)' }}>
            <div className="label">{t('budget.freeMoney')}</div>
            <div className="value mono" style={{ color: dineroLibre >= 0 ? 'var(--online)' : 'var(--danger)' }}>
              {formatMXN(dineroLibre)}
            </div>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>{t('budget.freeMoneyDesc')}</p>
      </div>

      <Seccion
        titulo={t('budget.currentMoneyTitle')}
        desc={t('budget.currentMoneyDesc')}
        totalLabel={t('budget.totalCurrentMoney')}
        total={totalDineroActual}
        items={cuentas}
        onAdd={addCuenta}
        onUpdate={updateCuenta}
        onRemove={removeCuenta}
        t={t}
        conConceptoPlaceholder={t('budget.conceptPlaceholder')}
        conTipo
        emptyMsg={t('budget.emptyAccounts')}
      />

      <Seccion
        titulo={t('budget.incomeTitle')}
        desc={t('budget.incomeDesc')}
        totalLabel={t('budget.totalIncome')}
        total={totalIngresos}
        items={ingresos}
        onAdd={addIngreso}
        onUpdate={updateIngreso}
        onRemove={removeIngreso}
        t={t}
        conConceptoPlaceholder={t('budget.incomePlaceholder')}
        emptyMsg={t('budget.emptyIncome')}
      />

      <Seccion
        titulo={t('budget.fixedExpensesTitle')}
        desc={t('budget.fixedExpensesDesc')}
        totalLabel={t('budget.totalFixedExpenses')}
        total={totalGastosFijos}
        items={gastosFijos}
        onAdd={addGastoFijo}
        onUpdate={updateGastoFijo}
        onRemove={removeGastoFijo}
        t={t}
        conConceptoPlaceholder={t('budget.expensePlaceholder')}
        emptyMsg={t('budget.emptyExpenses')}
      />
    </div>
  )
}
