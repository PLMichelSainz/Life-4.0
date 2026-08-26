import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { formatMXN } from '../../utils/overtime'
import { formatShort, todayISO } from '../../utils/dates'

function calcularDeuda(deuda) {
  const pagado = (deuda.pagos || []).reduce((a, p) => a + (Number(p.monto) || 0), 0)
  const pendiente = Math.max(0, (Number(deuda.montoTotal) || 0) - pagado)
  const liquidada = pendiente === 0 && deuda.montoTotal > 0
  const avance = deuda.montoTotal > 0 ? Math.min(100, Math.round((pagado / deuda.montoTotal) * 100)) : 0
  return { pagado, pendiente, liquidada, avance }
}

function TarjetaDeuda({ deuda, onEditar }) {
  const { addPagoDeuda, removePagoDeuda, removeDeuda } = useAppData()
  const [montoPago, setMontoPago] = useState('')
  const [fechaPago, setFechaPago] = useState(todayISO())
  const [verHistorial, setVerHistorial] = useState(false)

  const { pagado, pendiente, liquidada, avance } = useMemo(() => calcularDeuda(deuda), [deuda])
  const pagos = deuda.pagos || []

  function registrarPago(e) {
    e.preventDefault()
    const monto = Number(montoPago)
    if (!monto || monto <= 0) return
    addPagoDeuda(deuda.id, monto, fechaPago)
    setMontoPago('')
  }

  return (
    <div className="card" style={liquidada ? { opacity: 0.75 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {deuda.nombre}
            {liquidada && <span className="pill current">liquidada</span>}
          </p>
          <p className="card-sub" style={{ marginBottom: 0 }}>Monto total: {formatMXN(deuda.montoTotal)}</p>
          {deuda.comentario && (
            <p className="card-sub" style={{ margin: '6px 0 0' }}>{deuda.comentario}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn" onClick={() => onEditar(deuda)}>Editar</button>
          <button className="btn danger" onClick={() => removeDeuda(deuda.id)}>Eliminar</button>
        </div>
      </div>

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
        <div className="card-sub" style={{ marginTop: 6, marginBottom: 0 }}>{avance}% pagado</div>
      </div>

      <div className="grid cols-3">
        <div className="stat">
          <div className="label">Pagado</div>
          <div className="value mono">{formatMXN(pagado)}</div>
        </div>
        <div className="stat" style={{ borderColor: liquidada ? 'var(--online)' : 'var(--accent)' }}>
          <div className="label">Pendiente</div>
          <div className={`value mono ${liquidada ? '' : 'accent'}`}>{formatMXN(pendiente)}</div>
        </div>
        <div className="stat">
          <div className="label">Pagos registrados</div>
          <div className="value mono">{pagos.length}</div>
        </div>
      </div>

      {!liquidada && (
        <form onSubmit={registrarPago} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>Monto del pago</label>
            <input type="number" min="0" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>Fecha</label>
            <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
          </div>
          <button type="submit" className="btn primary">Agregar pago</button>
        </form>
      )}

      {pagos.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setVerHistorial((v) => !v)}>
            {verHistorial ? 'Ocultar historial' : `Ver historial (${pagos.length})`}
          </button>
          {verHistorial && (
            <div style={{ marginTop: 8 }}>
              {[...pagos]
                .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                .map((p) => (
                  <div className="day-row" key={p.id}>
                    <div>
                      <div className="day-name mono">{formatMXN(p.monto)}</div>
                      <div className="day-date">{formatShort(p.fecha)}</div>
                    </div>
                    <button className="btn danger" onClick={() => removePagoDeuda(deuda.id, p.id)}>Quitar</button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Debts() {
  const { deudas, addDeuda, updateDeuda } = useAppData()
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [comentario, setComentario] = useState('')
  const [editId, setEditId] = useState(null)

  const calculadas = useMemo(() => deudas.map((d) => ({ ...d, ...calcularDeuda(d) })), [deudas])
  const activas = calculadas.filter((d) => !d.liquidada)
  const liquidadas = calculadas.filter((d) => d.liquidada)

  const totalPagadoGlobal = calculadas.reduce((a, d) => a + d.pagado, 0)
  const totalPendienteGlobal = calculadas.reduce((a, d) => a + d.pendiente, 0)

  function limpiarFormulario() {
    setNombre('')
    setMonto('')
    setComentario('')
    setEditId(null)
  }

  function guardarDeuda(e) {
    e.preventDefault()
    if (!nombre.trim() || !Number(monto)) return

    if (editId) {
      updateDeuda(editId, {
        nombre: nombre.trim(),
        montoTotal: Number(monto) || 0,
        comentario: comentario.trim(),
      })
    } else {
      addDeuda(nombre.trim(), monto, comentario.trim())
    }

    limpiarFormulario()
  }

  function editarDeuda(deuda) {
    setEditId(deuda.id)
    setNombre(deuda.nombre)
    setMonto(String(deuda.montoTotal))
    setComentario(deuda.comentario || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">Resumen global</p>
        <div className="grid cols-2">
          <div className="stat">
            <div className="label">Total pagado acumulado</div>
            <div className="value mono">{formatMXN(totalPagadoGlobal)}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">Total pendiente</div>
            <div className="value accent mono">{formatMXN(totalPendienteGlobal)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">{editId ? 'Editar deuda' : 'Agregar nueva deuda'}</p>
        <form onSubmit={guardarDeuda} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Tarjeta BBVA" />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label>Monto total (MXN)</label>
            <input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>Comentario / notas (opcional)</label>
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej. fecha de pago, acuerdo, referencia..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn primary">{editId ? 'Guardar cambios' : 'Agregar deuda'}</button>
            {editId && <button type="button" className="btn" onClick={limpiarFormulario}>Cancelar</button>}
          </div>
        </form>
      </div>

      {activas.length === 0 && liquidadas.length === 0 && (
        <div className="card"><p className="empty">Aún no registras ninguna deuda.</p></div>
      )}

      {activas.map((d) => <TarjetaDeuda key={d.id} deuda={d} onEditar={editarDeuda} />)}

      {liquidadas.length > 0 && (
        <>
          <p className="card-sub" style={{ margin: '18px 4px 8px' }}>Liquidadas</p>
          {liquidadas.map((d) => <TarjetaDeuda key={d.id} deuda={d} onEditar={editarDeuda} />)}
        </>
      )}
    </div>
  )
}
