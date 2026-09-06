import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { formatMXN } from '../../utils/overtime'

function Switch({ on, onToggle, onLabel, offLabel }) {
  return (
    <div className="switch-field">
      <button type="button" className={`switch${on ? ' on' : ''}`} onClick={onToggle} aria-pressed={on}>
        <span className="knob" />
      </button>
      <span className={`switch-label ${on ? 'on' : 'off'}`}>{on ? onLabel : offLabel}</span>
    </div>
  )
}

function ProductoCard({ p, t, onUpdate, onRemove, onToggle }) {
  const [editando, setEditando] = useState(false)
  const [f, setF] = useState({
    nombre: p.nombre, categoria: p.categoria, precio: String(p.precio), cantidad: String(p.cantidad),
    unidad: p.unidad, dondeComprar: p.dondeComprar, frecuencia: p.frecuencia, notas: p.notas,
  })

  function guardar(e) {
    e.preventDefault()
    if (!f.nombre.trim()) return
    onUpdate(p.id, {
      nombre: f.nombre.trim(),
      categoria: f.categoria.trim(),
      precio: Number(f.precio) || 0,
      cantidad: Number(f.cantidad) || 1,
      unidad: f.unidad.trim(),
      dondeComprar: f.dondeComprar.trim(),
      frecuencia: f.frecuencia.trim(),
      notas: f.notas.trim(),
    })
    setEditando(false)
  }

  const detalle = [p.cantidad > 1 ? `${p.cantidad} ${p.unidad || ''}`.trim() : p.unidad, p.dondeComprar, p.frecuencia]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="card" style={p.estado === 'tengo' ? { opacity: 0.8 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {p.nombre}
            {p.categoria && <span className="pill">{p.categoria}</span>}
          </p>
          <p className="card-sub" style={{ marginBottom: 0 }}>
            {formatMXN(p.precio)}
            {detalle ? ` · ${detalle}` : ''}
          </p>
          {p.notas && <p className="card-sub" style={{ marginBottom: 0 }}>{p.notas}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setEditando((v) => !v)}>{editando ? t('common.close') : t('common.edit')}</button>
          <button className="btn danger" onClick={() => onRemove(p.id)}>{t('common.delete')}</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Switch on={p.estado === 'tengo'} onToggle={() => onToggle(p.id)} onLabel={`🟢 ${t('products.have')}`} offLabel={`🔴 ${t('products.need')}`} />
      </div>

      {editando && (
        <form onSubmit={guardar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('products.name')}</label>
            <input type="text" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('budget.category')}</label>
            <input type="text" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} />
          </div>
          <div style={{ width: 110 }}>
            <label>{t('products.estimatedPrice')}</label>
            <input type="number" min="0" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} />
          </div>
          <div style={{ width: 90 }}>
            <label>{t('products.quantity')}</label>
            <input type="number" min="1" value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} />
          </div>
          <div style={{ width: 110 }}>
            <label>{t('products.unit')}</label>
            <input type="text" value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('products.whereToBuy')}</label>
            <input type="text" value={f.dondeComprar} onChange={(e) => setF({ ...f, dondeComprar: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label>{t('products.frequency')}</label>
            <input type="text" value={f.frecuencia} onChange={(e) => setF({ ...f, frecuencia: e.target.value })} />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('products.notes')}</label>
            <input type="text" value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </div>
          <button type="submit" className="btn primary">{t('common.saveChanges')}</button>
        </form>
      )}
    </div>
  )
}

export default function Products() {
  const { productos, addProducto, updateProducto, removeProducto, toggleProductoEstado } = useAppData()
  const { t } = useLanguage()
  const [f, setF] = useState({ nombre: '', categoria: '', precio: '', cantidad: '1', unidad: '', dondeComprar: '', frecuencia: '', notas: '' })

  const necesitan = productos.filter((p) => p.estado === 'necesito')
  const tienen = productos.filter((p) => p.estado === 'tengo')
  const totalNecesario = useMemo(() => necesitan.reduce((a, p) => a + (Number(p.precio) || 0), 0), [necesitan])

  function submit(e) {
    e.preventDefault()
    if (!f.nombre.trim()) return
    addProducto(f)
    setF({ nombre: '', categoria: '', precio: '', cantidad: '1', unidad: '', dondeComprar: '', frecuencia: '', notas: '' })
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">{t('products.title')}</p>
        <p className="card-sub">{t('products.desc')}</p>
        <div className="stat" style={{ borderColor: 'var(--accent)' }}>
          <div className="label">{t('products.totalNeeded')}</div>
          <div className="value accent mono">{formatMXN(totalNecesario)}</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">{t('common.add')}</p>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('products.name')}</label>
            <input type="text" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder={t('products.namePlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('budget.category')}</label>
            <input type="text" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} placeholder={t('budget.categoryPlaceholder')} />
          </div>
          <div style={{ width: 110 }}>
            <label>{t('products.estimatedPrice')}</label>
            <input type="number" min="0" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} placeholder="0.00" />
          </div>
          <div style={{ width: 90 }}>
            <label>{t('products.quantity')}</label>
            <input type="number" min="1" value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} />
          </div>
          <div style={{ width: 110 }}>
            <label>{t('products.unit')}</label>
            <input type="text" value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} placeholder={t('products.unitPlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('products.whereToBuy')}</label>
            <input type="text" value={f.dondeComprar} onChange={(e) => setF({ ...f, dondeComprar: e.target.value })} placeholder={t('products.whereToBuyPlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label>{t('products.frequency')}</label>
            <input type="text" value={f.frecuencia} onChange={(e) => setF({ ...f, frecuencia: e.target.value })} placeholder={t('products.frequencyPlaceholder')} />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('products.notes')}</label>
            <input type="text" value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} />
          </div>
          <button type="submit" className="btn primary">{t('products.add')}</button>
        </form>
      </div>

      {productos.length === 0 && <div className="card"><p className="empty">{t('products.empty')}</p></div>}

      {necesitan.map((p) => (
        <ProductoCard key={p.id} p={p} t={t} onUpdate={updateProducto} onRemove={removeProducto} onToggle={toggleProductoEstado} />
      ))}
      {tienen.map((p) => (
        <ProductoCard key={p.id} p={p} t={t} onUpdate={updateProducto} onRemove={removeProducto} onToggle={toggleProductoEstado} />
      ))}
    </div>
  )
}
