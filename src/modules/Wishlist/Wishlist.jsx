import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { formatMXN } from '../../utils/overtime'
import { formatShort, todayISO } from '../../utils/dates'

function calcularMeta(item) {
  const ahorrado = (item.aportes || []).reduce((a, p) => a + (Number(p.monto) || 0), 0)
  const restante = Math.max(0, item.precio - ahorrado)
  const lista = restante === 0 && item.precio > 0
  const avance = item.precio > 0 ? Math.min(100, Math.round((ahorrado / item.precio) * 100)) : 0
  return { ahorrado, restante, lista, avance }
}

function TarjetaMeta({ item, t, lang }) {
  const { addAporteWishlist, removeAporteWishlist, removeWishlistItem, updateWishlistItem } = useAppData()
  const [montoAporte, setMontoAporte] = useState('')
  const [fechaAporte, setFechaAporte] = useState(todayISO())
  const [verHistorial, setVerHistorial] = useState(false)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(item.nombre)
  const [precio, setPrecio] = useState(String(item.precio))
  const [comentario, setComentario] = useState(item.comentario || '')

  const { ahorrado, restante, lista, avance } = useMemo(() => calcularMeta(item), [item])

  function registrarAporte(e) {
    e.preventDefault()
    const monto = Number(montoAporte)
    if (!monto || monto <= 0) return
    addAporteWishlist(item.id, monto, fechaAporte)
    setMontoAporte('')
  }

  function guardarEdicion(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    updateWishlistItem(item.id, { nombre: nombre.trim(), precio: Number(precio) || 0, comentario: comentario.trim() })
    setEditando(false)
  }

  return (
    <div className="card" style={lista ? { opacity: 0.75 } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.nombre}
            {lista && <span className="pill current">{t('wishlist.done')}</span>}
          </p>
          <p className="card-sub" style={{ marginBottom: 0 }}>
            {t('wishlist.costLabel')} {formatMXN(item.precio)}
            {item.comentario ? ` · ${item.comentario}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setEditando((v) => !v)}>{editando ? t('common.close') : t('common.edit')}</button>
          <button className="btn danger" onClick={() => removeWishlistItem(item.id)}>{t('common.delete')}</button>
        </div>
      </div>

      {editando && (
        <form onSubmit={guardarEdicion} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('common.name')}</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('wishlist.cost')}</label>
            <input type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
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
              background: lista ? 'var(--online)' : 'var(--accent)',
              transition: 'width .25s ease',
            }}
          />
        </div>
        <div className="card-sub" style={{ marginTop: 6, marginBottom: 0 }}>{avance}{t('wishlist.savedPct')}</div>
      </div>

      <div className="grid cols-3">
        <div className="stat">
          <div className="label">{t('wishlist.saved')}</div>
          <div className="value mono">{formatMXN(ahorrado)}</div>
        </div>
        <div className="stat" style={{ borderColor: lista ? 'var(--online)' : 'var(--accent)' }}>
          <div className="label">{t('wishlist.remaining')}</div>
          <div className={`value mono ${lista ? '' : 'accent'}`}>{formatMXN(restante)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('wishlist.contributionsCount')}</div>
          <div className="value mono">{(item.aportes || []).length}</div>
        </div>
      </div>

      {!lista && (
        <form onSubmit={registrarAporte} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('wishlist.contributionAmount')}</label>
            <input type="number" min="0" value={montoAporte} onChange={(e) => setMontoAporte(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label>{t('common.date')}</label>
            <input type="date" value={fechaAporte} onChange={(e) => setFechaAporte(e.target.value)} />
          </div>
          <button type="submit" className="btn primary">{t('wishlist.addContribution')}</button>
        </form>
      )}

      {(item.aportes || []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setVerHistorial((v) => !v)}>
            {verHistorial ? t('wishlist.hideHistory') : t('wishlist.viewHistory')(item.aportes.length)}
          </button>
          {verHistorial && (
            <div style={{ marginTop: 8 }}>
              {[...item.aportes]
                .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                .map((a) => (
                  <div className="day-row" key={a.id}>
                    <div>
                      <div className="day-name mono">{formatMXN(a.monto)}</div>
                      <div className="day-date">{formatShort(a.fecha, lang)}</div>
                    </div>
                    <button className="btn danger" onClick={() => removeAporteWishlist(item.id, a.id)}>{t('common.remove')}</button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Wishlist() {
  const { wishlist, addWishlistItem } = useAppData()
  const { t, lang } = useLanguage()
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [comentario, setComentario] = useState('')

  const calculadas = useMemo(() => wishlist.map((it) => ({ ...it, ...calcularMeta(it) })), [wishlist])
  const activas = calculadas.filter((it) => !it.lista)
  const listas = calculadas.filter((it) => it.lista)

  const totalAhorradoGlobal = calculadas.reduce((a, it) => a + it.ahorrado, 0)
  const totalRestanteGlobal = calculadas.reduce((a, it) => a + it.restante, 0)

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
        <p className="card-title">{t('wishlist.globalSummary')}</p>
        <div className="grid cols-2">
          <div className="stat">
            <div className="label">{t('wishlist.totalSaved')}</div>
            <div className="value mono">{formatMXN(totalAhorradoGlobal)}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">{t('wishlist.totalPending')}</div>
            <div className="value accent mono">{formatMXN(totalRestanteGlobal)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">{t('wishlist.addGoal')}</p>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>{t('common.name')}</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('wishlist.namePlaceholder')} />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{t('wishlist.cost')}</label>
            <input type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ flexBasis: '100%' }}>
            <label>{t('common.comment')}</label>
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={t('wishlist.commentPlaceholder')}
            />
          </div>
          <button type="submit" className="btn primary">{t('common.add')}</button>
        </form>
      </div>

      {activas.length === 0 && listas.length === 0 && (
        <div className="card"><p className="empty">{t('wishlist.empty')}</p></div>
      )}

      {activas.map((it) => <TarjetaMeta key={it.id} item={it} t={t} lang={lang} />)}

      {listas.length > 0 && (
        <>
          <p className="card-sub" style={{ margin: '18px 4px 8px' }}>{t('wishlist.completed')}</p>
          {listas.map((it) => <TarjetaMeta key={it.id} item={it} t={t} lang={lang} />)}
        </>
      )}
    </div>
  )
}
