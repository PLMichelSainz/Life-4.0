import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { formatMXN } from '../../utils/overtime'
import { formatShort, todayISO } from '../../utils/dates'

function calcularMeta(item) {
  const abonos = Array.isArray(item.abonos) ? item.abonos : []
  const ahorrado = abonos.reduce((a, p) => a + (Number(p.monto) || 0), 0)
  const precio = Number(item.precio) || 0
  const pendiente = Math.max(0, precio - ahorrado)
  const avance = precio > 0 ? Math.min(100, Math.round((ahorrado / precio) * 100)) : 0
  return { ahorrado, pendiente, avance, abonos }
}

function TarjetaWishlist({ item }) {
  const { addAbonoWishlist, removeAbonoWishlist, removeWishlistItem, updateWishlistItem, toggleWishlistItem } = useAppData()
  const [montoAbono, setMontoAbono] = useState('')
  const [fechaAbono, setFechaAbono] = useState(todayISO())
  const [verHistorial, setVerHistorial] = useState(false)
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(item.nombre)
  const [precioEdit, setPrecioEdit] = useState(String(item.precio))
  const [comentarioEdit, setComentarioEdit] = useState(item.comentario || '')

  const { ahorrado, pendiente, avance, abonos } = useMemo(() => calcularMeta(item), [item])

  function registrarAbono(e) {
    e.preventDefault()
    const monto = Number(montoAbono)
    if (!monto || monto <= 0) return
    addAbonoWishlist(item.id, monto, fechaAbono)
    setMontoAbono('')
    setFechaAbono(todayISO())
  }

  function guardarEdicion(e) {
    e.preventDefault()
    if (!nombreEdit.trim()) return
    updateWishlistItem(item.id, {
      nombre: nombreEdit.trim(),
      precio: Number(precioEdit) || 0,
      comentario: comentarioEdit.trim(),
    })
    setEditando(false)
  }

  return (
    <div className={`card${item.completado ? ' wishlist-completed' : ''}`}>
      {editando ? (
        <form onSubmit={guardarEdicion}>
          <p className="card-title">Editar meta</p>
          <div className="grid cols-2">
            <div>
              <label>Nombre</label>
              <input value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} />
            </div>
            <div>
              <label>Costo (MXN)</label>
              <input type="number" min="0" value={precioEdit} onChange={(e) => setPrecioEdit(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label>Comentario (opcional)</label>
            <input value={comentarioEdit} onChange={(e) => setComentarioEdit(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn primary" type="submit">Guardar</button>
            <button className="btn" type="button" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', minWidth: 0 }}>
              <input
                type="checkbox"
                checked={Boolean(item.completado)}
                onChange={() => toggleWishlistItem(item.id)}
                style={{ marginTop: 4 }}
              />
              <div className="name" style={{ textDecoration: 'none' }}>
                <div style={{ textDecoration: item.completado ? 'line-through' : 'none' }}>
                  {item.nombre}
                </div>
                {item.comentario && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                    {item.comentario}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn" onClick={() => setEditando(true)}>Editar</button>
              <button className="btn danger" onClick={() => removeWishlistItem(item.id)}>Eliminar</button>
            </div>
          </div>

          <div style={{ margin: '14px 0 10px' }}>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden', boxShadow: 'var(--shadow-inset)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${avance}%`,
                  background: item.completado || pendiente === 0 ? 'var(--online)' : 'var(--accent)',
                  transition: 'width .25s ease',
                }}
              />
            </div>
            <div className="card-sub" style={{ margin: '6px 0 0' }}>{avance}% ahorrado</div>
          </div>

          <div className="grid cols-3">
            <div className="stat">
              <div className="label">Costo</div>
              <div className="value mono">{formatMXN(item.precio)}</div>
            </div>
            <div className="stat">
              <div className="label">Ahorrado</div>
              <div className="value mono">{formatMXN(ahorrado)}</div>
            </div>
            <div className="stat" style={{ borderColor: pendiente === 0 ? 'var(--online)' : 'var(--accent)' }}>
              <div className="label">Restante</div>
              <div className={`value mono ${pendiente === 0 ? '' : 'accent'}`}>{formatMXN(pendiente)}</div>
            </div>
          </div>

          <form onSubmit={registrarAbono} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 110 }}>
              <label>Monto del ahorro</label>
              <input
                type="number"
                min="0"
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label>Fecha</label>
              <input type="date" value={fechaAbono} onChange={(e) => setFechaAbono(e.target.value)} />
            </div>
            <button type="submit" className="btn primary">Agregar ahorro</button>
          </form>

          {abonos.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setVerHistorial((v) => !v)}>
                {verHistorial ? 'Ocultar historial' : `Ver historial (${abonos.length})`}
              </button>
              {verHistorial && (
                <div style={{ marginTop: 8 }}>
                  {[...abonos]
                    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                    .map((p) => (
                      <div className="day-row" key={p.id}>
                        <div>
                          <div className="day-name mono">{formatMXN(p.monto)}</div>
                          <div className="day-date">{formatShort(p.fecha)}</div>
                        </div>
                        <button className="btn danger" onClick={() => removeAbonoWishlist(item.id, p.id)}>Quitar</button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Wishlist() {
  const { wishlist, addWishlistItem } = useAppData()
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [comentario, setComentario] = useState('')

  const resumen = useMemo(() => wishlist.reduce(
    (acc, item) => {
      const meta = calcularMeta(item)
      acc.costo += Number(item.precio) || 0
      acc.ahorrado += meta.ahorrado
      acc.pendiente += meta.pendiente
      return acc
    },
    { costo: 0, ahorrado: 0, pendiente: 0 }
  ), [wishlist])

  function submit(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    addWishlistItem(nombre.trim(), precio, comentario.trim())
    setNombre('')
    setPrecio('')
    setComentario('')
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">Resumen</p>
        <div className="grid cols-3">
          <div className="stat">
            <div className="label">Costo total</div>
            <div className="value mono">{formatMXN(resumen.costo)}</div>
          </div>
          <div className="stat">
            <div className="label">Ahorrado</div>
            <div className="value mono">{formatMXN(resumen.ahorrado)}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">Pendiente por ahorrar</div>
            <div className="value accent mono">{formatMXN(resumen.pendiente)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Agregar meta o producto</p>
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
          <button type="submit" className="btn primary">Agregar</button>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Mis metas</p>
        {wishlist.length === 0 && <p className="empty">Aún no agregas ninguna meta.</p>}
        {wishlist.map((item) => <TarjetaWishlist key={item.id} item={item} />)}
      </div>
    </div>
  )
}
