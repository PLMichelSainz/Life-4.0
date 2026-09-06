import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { formatShort } from '../../utils/dates'

const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 }
const PRIORIDAD_COLOR = { alta: 'var(--danger)', media: '#e0a030', baja: 'var(--text-muted)' }
const PRIORIDAD_ICONO = { alta: '🔴', media: '🟠', baja: '⚪' }
const PRIORIDAD_KEY = { alta: 'priorityHigh', media: 'priorityMedium', baja: 'priorityLow' }

function TareaFila({ p, t, lang, onUpdate, onRemove, onToggle }) {
  const [editando, setEditando] = useState(false)
  const [f, setF] = useState({
    titulo: p.titulo, prioridad: p.prioridad, categoria: p.categoria, fechaLimite: p.fechaLimite, notas: p.notas,
  })

  function guardar(e) {
    e.preventDefault()
    if (!f.titulo.trim()) return
    onUpdate(p.id, { ...f, titulo: f.titulo.trim() })
    setEditando(false)
  }

  const completado = p.estado === 'completado'

  return (
    <div className="card" style={completado ? { opacity: 0.65 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span title={t(`tasks.${PRIORIDAD_KEY[p.prioridad] || 'priorityMedium'}`)}>
              {PRIORIDAD_ICONO[p.prioridad] || '⚪'}
            </span>
            <span style={{
              textDecoration: completado ? 'line-through' : 'none',
              color: completado ? undefined : PRIORIDAD_COLOR[p.prioridad],
            }}>
              {p.titulo}
            </span>
          </p>
          <p className="card-sub" style={{ marginBottom: 0 }}>
            {p.categoria || ''}
            {p.categoria && p.fechaLimite ? ' · ' : ''}
            {p.fechaLimite ? formatShort(p.fechaLimite, lang) : ''}
          </p>
          {p.notas && <p className="card-sub" style={{ marginBottom: 0 }}>{p.notas}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => onToggle(p.id)}>
            {completado ? t('tasks.markPending') : t('tasks.markDone')}
          </button>
          <button className="btn" onClick={() => setEditando((v) => !v)}>{editando ? t('common.close') : t('common.edit')}</button>
          <button className="btn danger" onClick={() => onRemove(p.id)}>{t('common.delete')}</button>
        </div>
      </div>

      {editando && (
        <form onSubmit={guardar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('tasks.titleField')}</label>
            <input type="text" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
          </div>
          <div style={{ width: 130 }}>
            <label>{t('tasks.priority')}</label>
            <select value={f.prioridad} onChange={(e) => setF({ ...f, prioridad: e.target.value })}>
              <option value="alta">🔴 {t('tasks.priorityHigh')}</option>
              <option value="media">🟠 {t('tasks.priorityMedium')}</option>
              <option value="baja">⚪ {t('tasks.priorityLow')}</option>
            </select>
          </div>
          <div style={{ width: 140 }}>
            <label>{t('tasks.dueDate')}</label>
            <input type="date" value={f.fechaLimite} onChange={(e) => setF({ ...f, fechaLimite: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('tasks.category')}</label>
            <input type="text" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('tasks.notes')}</label>
            <input type="text" value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </div>
          <button type="submit" className="btn primary">{t('common.saveChanges')}</button>
        </form>
      )}
    </div>
  )
}

export default function Tasks() {
  const { pendientes, addPendiente, updatePendiente, removePendiente, togglePendienteEstado } = useAppData()
  const { t, lang } = useLanguage()
  const [f, setF] = useState({ titulo: '', prioridad: 'media', categoria: '', fechaLimite: '', notas: '' })

  const activos = useMemo(
    () =>
      pendientes
        .filter((p) => p.estado !== 'completado')
        .sort((a, b) => (PRIORIDAD_ORDEN[a.prioridad] ?? 1) - (PRIORIDAD_ORDEN[b.prioridad] ?? 1)),
    [pendientes]
  )
  const completados = pendientes.filter((p) => p.estado === 'completado')

  function submit(e) {
    e.preventDefault()
    if (!f.titulo.trim()) return
    addPendiente(f)
    setF({ titulo: '', prioridad: 'media', categoria: '', fechaLimite: '', notas: '' })
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">{t('tasks.title')}</p>
        <p className="card-sub">{t('tasks.desc')}</p>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('tasks.titleField')}</label>
            <input type="text" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder={t('tasks.titlePlaceholder')} />
          </div>
          <div style={{ width: 130 }}>
            <label>{t('tasks.priority')}</label>
            <select value={f.prioridad} onChange={(e) => setF({ ...f, prioridad: e.target.value })}>
              <option value="alta">🔴 {t('tasks.priorityHigh')}</option>
              <option value="media">🟠 {t('tasks.priorityMedium')}</option>
              <option value="baja">⚪ {t('tasks.priorityLow')}</option>
            </select>
          </div>
          <div style={{ width: 140 }}>
            <label>{t('tasks.dueDate')}</label>
            <input type="date" value={f.fechaLimite} onChange={(e) => setF({ ...f, fechaLimite: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('tasks.category')}</label>
            <input type="text" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('tasks.notes')}</label>
            <input type="text" value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </div>
          <button type="submit" className="btn primary">{t('tasks.add')}</button>
        </form>
      </div>

      {activos.length === 0 && completados.length === 0 && (
        <div className="card"><p className="empty">{t('tasks.empty')}</p></div>
      )}

      {activos.map((p) => (
        <TareaFila key={p.id} p={p} t={t} lang={lang} onUpdate={updatePendiente} onRemove={removePendiente} onToggle={togglePendienteEstado} />
      ))}

      {completados.length > 0 && (
        <>
          <p className="card-sub" style={{ margin: '18px 4px 8px' }}>{t('tasks.completed')}</p>
          {completados.map((p) => (
            <TareaFila key={p.id} p={p} t={t} lang={lang} onUpdate={updatePendiente} onRemove={removePendiente} onToggle={togglePendienteEstado} />
          ))}
        </>
      )}
    </div>
  )
}
