import { useEffect, useRef, useState } from 'react'
import { useConfirm } from '../../components/ConfirmDialog'
import { dayName, formatShort, formatLong } from '../../utils/dates'
import { leerHorarioImagen, terminarOcr } from '../../utils/scheduleOcr'
import {
  CLASES, totalesHorario, huecos, solapes, fmtHora, fmtDuracion, minAHHMM, hhmmAMin, minAHoras,
} from '../../utils/schedule'

function ResumenTiempos({ x, t }) {
  return (
    <>
      <div className="grid cols-3">
        <div className="stat">
          <div className="label">{t('overtime.schedOpen')}</div>
          <div className="value mono">{fmtDuracion(x.open)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('overtime.schedExt')}</div>
          <div className="value mono accent">{fmtDuracion(x.ext)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('overtime.schedTrain')}</div>
          <div className="value mono">{fmtDuracion(x.train)}</div>
        </div>
      </div>
      <div className="grid cols-2" style={{ marginTop: 10 }}>
        <div className="stat" style={{ borderColor: 'var(--accent)' }}>
          <div className="label">{t('overtime.schedTotal')}</div>
          <div className="value mono accent">{fmtDuracion(x.trabajado)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('overtime.totalDecimal')}</div>
          <div className="value mono">{minAHoras(x.trabajado)} h</div>
        </div>
      </div>
    </>
  )
}

export default function ScheduleCapture({ dias, horarios, onSave, onRemove, lang, t }) {
  const pedirConfirmacion = useConfirm()
  const [procesando, setProcesando] = useState(null) // { i, n }
  const [mensajes, setMensajes] = useState([])
  const [pendientes, setPendientes] = useState([]) // capturas sin fecha reconocida
  const [seleccionado, setSeleccionado] = useState(null)
  const inputRef = useRef(null)
  const procesarRef = useRef(null)

  function addMsg(tipo, texto) {
    setMensajes((prev) => [...prev.slice(-4), { id: crypto.randomUUID(), tipo, texto }])
  }

  async function procesar(files) {
    const imgs = [...(files || [])].filter((f) => f.type && f.type.startsWith('image/'))
    if (!imgs.length || procesando) return
    setMensajes([])
    for (let i = 0; i < imgs.length; i++) {
      setProcesando({ i: i + 1, n: imgs.length, p: 1, m: 1 })
      try {
        const { fecha, filas, completa } = await leerHorarioImagen(imgs[i], (p, m) =>
          setProcesando({ i: i + 1, n: imgs.length, p, m })
        )
        if (!filas.length) {
          addMsg('error', `${t('overtime.noRows')} ${imgs[i].name || ''}`)
          continue
        }
        const rows = filas.map(({ c, s, e }) => ({ c, s, e }))
        if (fecha) {
          onSave(fecha, rows)
          setSeleccionado(fecha)
          addMsg('ok', t('overtime.loadedDay')(formatLong(fecha, lang)))
          if (!completa) addMsg('error', t('overtime.checkGaps')(formatShort(fecha, lang)))
        } else {
          setPendientes((p) => [...p, { id: crypto.randomUUID(), rows }])
        }
      } catch (err) {
        console.error(err)
        addMsg('error', t('overtime.readerError'))
        break
      }
    }
    setProcesando(null)
  }
  procesarRef.current = procesar

  // Pegar capturas con Ctrl+V desde cualquier parte de la pantalla.
  useEffect(() => {
    function alPegar(e) {
      const archivos = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'))
      if (archivos.length) {
        e.preventDefault()
        procesarRef.current(archivos)
      }
    }
    window.addEventListener('paste', alPegar)
    return () => {
      window.removeEventListener('paste', alPegar)
      terminarOcr()
    }
  }, [])

  // ---- resumen de la catorcena según horario ----
  let nDias = 0
  const tot = { open: 0, ext: 0, train: 0, trabajado: 0 }
  dias.forEach((f) => {
    const h = horarios[f]
    if (!h) return
    nDias += 1
    const x = totalesHorario(h.rows)
    tot.open += x.open
    tot.ext += x.ext
    tot.train += x.train
    tot.trabajado += x.trabajado
  })

  const sel = seleccionado && horarios[seleccionado] ? horarios[seleccionado] : null
  const selTot = sel ? totalesHorario(sel.rows) : null
  const selHuecos = sel ? huecos(sel.rows) : []
  const selSolapes = sel ? solapes(sel.rows) : []

  function editarFila(idx, cambios) {
    const rows = sel.rows.map((r, i) => (i === idx ? { ...r, ...cambios } : r))
    onSave(seleccionado, rows)
  }
  function quitarFila(idx) {
    onSave(seleccionado, sel.rows.filter((_, i) => i !== idx))
  }
  function rellenarHueco(g, clase) {
    const rows = [...sel.rows, { c: clase, s: g.desde, e: g.hasta }].sort((a, b) => a.s - b.s)
    onSave(seleccionado, rows)
  }
  function agregarFila() {
    const ultimo = sel.rows.length ? Math.max(...sel.rows.map((r) => r.e)) : 8 * 60
    onSave(seleccionado, [...sel.rows, { c: 'open', s: ultimo, e: ultimo + 30 }])
  }

  return (
    <div
      className="card"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        procesar(e.dataTransfer.files)
      }}
    >
      <p className="card-title">{t('overtime.scheduleTitle')}</p>
      <p className="card-sub">{t('overtime.scheduleDesc')}</p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="btn primary" disabled={Boolean(procesando)} onClick={() => inputRef.current?.click()}>
          {t('overtime.chooseImages')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            procesar(e.target.files)
            e.target.value = ''
          }}
        />
        {procesando && (
          <span className="pill current">
            {t('overtime.readingImg')(procesando.i, procesando.n)} · {t('overtime.pass')(procesando.p, procesando.m)}
          </span>
        )}
      </div>

      {mensajes.map((m) => (
        <p key={m.id} className="card-sub" style={{ margin: '0 0 4px', color: m.tipo === 'error' ? 'var(--danger)' : 'var(--online)' }}>
          {m.texto}
        </p>
      ))}

      {pendientes.length > 0 && (
        <div style={{ margin: '8px 0 12px' }}>
          <p className="card-sub" style={{ marginBottom: 6 }}>{t('overtime.pendingTitle')}</p>
          {pendientes.map((p) => (
            <PendienteFila
              key={p.id}
              p={p}
              dias={dias}
              lang={lang}
              t={t}
              onAsignar={(fecha) => {
                onSave(fecha, p.rows)
                setSeleccionado(fecha)
                setPendientes((x) => x.filter((y) => y.id !== p.id))
              }}
              onDescartar={() => setPendientes((x) => x.filter((y) => y.id !== p.id))}
            />
          ))}
        </div>
      )}

      {/* 14 casillas: una por día de la catorcena */}
      <div className="slots-grid" style={{ marginBottom: 12 }}>
        {dias.map((f) => {
          const h = horarios[f]
          const minTrab = h ? totalesHorario(h.rows).trabajado : null
          const revisar = h ? huecos(h.rows).length + solapes(h.rows).length > 0 : false
          return (
            <button
              key={f}
              className="stat"
              onClick={() => setSeleccionado((actual) => (actual === f ? null : f))}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: seleccionado === f ? 'var(--accent)' : revisar ? 'var(--danger)' : h ? 'var(--online)' : undefined,
                color: 'inherit',
              }}
            >
              <div className="label">
                {dayName(f, true, lang)} · {formatShort(f, lang)}
                {revisar && <span style={{ color: 'var(--danger)' }} title={t('overtime.reviewDay')}> ⚠</span>}
              </div>
              <div className="value mono" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                {minTrab === null ? '—' : fmtDuracion(minTrab)}
              </div>
            </button>
          )
        })}
      </div>

      {nDias > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p className="card-sub" style={{ marginBottom: 6 }}>
            {t('overtime.schedCatorcena')} · {t('overtime.daysLoaded')(nDias, dias.length)}
          </p>
          <ResumenTiempos x={tot} t={t} />
        </div>
      )}

      {/* detalle y corrección del día seleccionado */}
      {sel && (
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
          <p className="card-title">{formatLong(seleccionado, lang)}</p>
          <div style={{ margin: '8px 0' }}>
            <ResumenTiempos x={selTot} t={t} />
          </div>
          <p className="card-sub">
            {t('overtime.schedUt')}: {fmtDuracion(selTot.ut)} · {t('overtime.schedBreaks')}: {fmtDuracion(selTot.break)}
          </p>

          {selHuecos.map((g) => (
            <div key={g.desde} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '0 0 6px' }}>
              <span className="card-sub" style={{ color: 'var(--danger)', margin: 0 }}>
                {t('overtime.gapWarn')(fmtHora(g.desde), fmtHora(g.hasta), g.min)}
              </span>
              <button className="btn" style={{ padding: '3px 9px', fontSize: '0.72rem' }} onClick={() => rellenarHueco(g, 'train')}>
                + {t('overtime.schedTrain')}
              </button>
              <button className="btn" style={{ padding: '3px 9px', fontSize: '0.72rem' }} onClick={() => rellenarHueco(g, 'open')}>
                + Open
              </button>
            </div>
          ))}

          {selSolapes.map((g) => (
            <p key={`s${g.desde}`} className="card-sub" style={{ color: 'var(--danger)', margin: '0 0 4px' }}>
              {t('overtime.overlapWarn')(fmtHora(g.desde), fmtHora(g.hasta), g.min)}
            </p>
          ))}

          {sel.rows.map((r, idx) => (
            <div className="day-row" key={idx} style={{ flexWrap: 'wrap' }}>
              <select
                style={{ flex: '1 1 180px', maxWidth: 240 }}
                value={r.c}
                onChange={(e) => editarFila(idx, { c: e.target.value })}
              >
                {CLASES.map((c) => (
                  <option key={c} value={c}>{t(`overtime.cls.${c}`)}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="time"
                  style={{ width: 120 }}
                  value={minAHHMM(r.s)}
                  onChange={(e) => {
                    const s = hhmmAMin(e.target.value)
                    editarFila(idx, { s, e: r.e <= s ? r.e + 1440 : r.e })
                  }}
                />
                <input
                  type="time"
                  style={{ width: 120 }}
                  value={minAHHMM(r.e)}
                  onChange={(e) => {
                    let en = hhmmAMin(e.target.value)
                    if (en <= r.s) en += 1440
                    editarFila(idx, { e: en })
                  }}
                />
                <span className="mono card-sub" style={{ margin: 0, minWidth: 54 }}>{r.e - r.s} min</span>
                <button className="btn danger" style={{ padding: '4px 10px' }} onClick={() => pedirConfirmacion(() => quitarFila(idx))}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={agregarFila}>{t('overtime.addRow')}</button>
            <button
              className="btn danger"
              onClick={() => pedirConfirmacion(() => {
                onRemove(seleccionado)
                setSeleccionado(null)
              })}
            >
              {t('overtime.removeSchedule')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PendienteFila({ p, dias, lang, t, onAsignar, onDescartar }) {
  const pedirConfirmacion = useConfirm()
  const [fecha, setFecha] = useState(dias[0])
  const horas = minAHoras(totalesHorario(p.rows).trabajado)
  return (
    <div className="day-row" style={{ flexWrap: 'wrap' }}>
      <span className="mono">{horas} h</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ margin: 0 }}>{t('overtime.assignTo')}</label>
        <select value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: 150 }}>
          {dias.map((f) => (
            <option key={f} value={f}>{dayName(f, true, lang)} {formatShort(f, lang)}</option>
          ))}
        </select>
        <button className="btn primary" onClick={() => onAsignar(fecha)}>{t('overtime.assign')}</button>
        <button className="btn danger" onClick={() => pedirConfirmacion(onDescartar)}>{t('overtime.discard')}</button>
      </div>
    </div>
  )
}
