import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { formatMXN } from '../../utils/overtime'

export default function Wishlist() {
  const { wishlist, addWishlistItem, updateWishlistItem, removeWishlistItem, toggleWishlistItem } = useAppData()
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [comentario, setComentario] = useState('')
  const [editId, setEditId] = useState(null)

  const totalGeneral = wishlist.reduce((a, it) => a + (Number(it.precio) || 0), 0)
  const totalPendiente = wishlist.filter((it) => !it.completado).reduce((a, it) => a + (Number(it.precio) || 0), 0)

  function submit(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    if (editId) {
      updateWishlistItem(editId, { nombre, precio: Number(precio) || 0, comentario })
      setEditId(null)
    } else {
      addWishlistItem(nombre.trim(), precio, comentario.trim())
    }
    setNombre('')
    setPrecio('')
    setComentario('')
  }

  function editar(item) {
    setEditId(item.id)
    setNombre(item.nombre)
    setPrecio(String(item.precio))
    setComentario(item.comentario || '')
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">Resumen</p>
        <div className="grid cols-2">
          <div className="stat">
            <div className="label">Total de la lista</div>
            <div className="value mono">{formatMXN(totalGeneral)}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">Pendiente por ahorrar</div>
            <div className="value accent mono">{formatMXN(totalPendiente)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">{editId ? 'Editar meta' : 'Agregar meta o producto'}</p>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Bicicleta" />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>Costo (MXN)</label>
            <input type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>Comentario (opcional)</label>
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej. color negro, talla M, esperar oferta..."
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="btn primary">{editId ? 'Guardar' : 'Agregar'}</button>
            {editId && (
              <button
                type="button"
                className="btn"
                onClick={() => { setEditId(null); setNombre(''); setPrecio(''); setComentario('') }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Mi lista</p>
        {wishlist.length === 0 && <p className="empty">Aún no agregas ninguna meta.</p>}
        {wishlist.map((item) => (
          <div className={`wishlist-item${item.completado ? ' done' : ''}`} key={item.id} style={{ alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={item.completado}
              onChange={() => toggleWishlistItem(item.id)}
              style={{ marginTop: 4 }}
            />
            <div className="name" style={{ textDecoration: 'none' }}>
              <div style={{ textDecoration: item.completado ? 'line-through' : 'none', color: item.completado ? 'var(--text-muted)' : 'inherit' }}>
                {item.nombre}
              </div>
              {item.comentario && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                  {item.comentario}
                </div>
              )}
            </div>
            <span className="mono">{formatMXN(item.precio)}</span>
            <button className="btn" onClick={() => editar(item)}>Editar</button>
            <button className="btn danger" onClick={() => removeWishlistItem(item.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  )
}
