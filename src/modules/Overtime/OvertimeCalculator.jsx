import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { addDays, formatShort, formatLong, dayName, todayISO, parseISODate, startOfWeekMonday } from '../../utils/dates'
import { calcularSemanaParcial, formatMXN, LIMITE_LEGAL_SEMANAL } from '../../utils/overtime'
import { indiceQuincenaTrabajada, quincenaTrabajadaPorIndice, diasDeQuincena, semanasQueTocan } from '../../utils/payroll'
import { totalesHorario, minAHoras, fmtDuracion, META_SEMANAL_HRS } from '../../utils/schedule'
import ScheduleCapture from './ScheduleCapture'
import DraftNumber from '../../components/DraftNumber'

const redondear2 = (n) => Math.round(n * 100) / 100

function BloqueSemana({ titulo, weekStart, inicio, fin, horas, onChange, undertime, onUndertime, horarios, resultado, lang, t }) {
  const uTotal = redondear2(undertime.reduce((a, b) => a + (Number(b) || 0), 0))

  // Verificación contra el horario leído de las capturas (Open + Schedule Extension)
  let nDias = 0
  let openMin = 0
  let extMin = 0
  for (let i = 0; i < 7; i++) {
    const h = horarios[addDays(weekStart, i)]
    if (!h) continue
    nDias += 1
    const x = totalesHorario(h.rows)
    openMin += x.open + x.train // Client Training cuenta como tiempo trabajado
    extMin += x.ext
  }
  const totalMin = openMin + extMin
  const totalSched = minAHoras(totalMin)
  const diffMin = totalMin - Math.round(META_SEMANAL_HRS * 60)

  return (
    <div className="card">
      <p className="card-title">{titulo}</p>
      <p className="card-sub">
        {formatShort(weekStart, lang)} – {formatShort(addDays(weekStart, 6), lang)} · {t('overtime.referenceShift')}: {resultado.jornadaOrdinaria} {t('overtime.hrs')}
      </p>

      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const fecha = addDays(weekStart, i)
        const fuera = fecha < inicio || fecha > fin // día de otra quincena (semana partida)
        return (
          <div className={`day-row${fuera ? ' locked' : ''}`} key={fecha}>
            <div>
              <div className="day-name">
                {dayName(fecha, false, lang)}
                {horarios[fecha] && <span className="pill" style={{ marginLeft: 8 }}>{t('overtime.fromSchedule')}</span>}
              </div>
              <div className="day-date">{formatShort(fecha, lang)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 96 }}>
                <label>{t('overtime.hoursLabel')}</label>
                <DraftNumber
                  min="0"
                  max="24"
                  step="0.01"
                  value={horas[i]}
                  placeholder="0"
                  disabled={fuera}
                  onCommit={(n) => onChange(i, n)}
                />
              </div>
              <div style={{ width: 96 }}>
                <label>{t('overtime.undertime')}</label>
                <DraftNumber
                  min="0"
                  max="24"
                  step="0.01"
                  value={undertime[i] || 0}
                  placeholder="0"
                  disabled={fuera}
                  onCommit={(n) => onUndertime(i, n)}
                />
              </div>
            </div>
          </div>
        )
      })}

      <p className="card-sub" style={{ margin: '10px 0 0' }}>
        {t('overtime.hoursLabel')}: <b className="mono">{resultado.total} {t('overtime.hrs')}</b>
        {uTotal > 0 && ` (− ${t('overtime.undertime')} ${uTotal})`}
      </p>

      <div className="grid cols-3" style={{ marginTop: 14 }}>
        <div className="stat">
          <div className="label">{t('overtime.ordinary')(LIMITE_LEGAL_SEMANAL)}</div>
          <div className="value mono">{resultado.ordinarias} {t('overtime.hrs')}</div>
          <div className="label mono">{formatMXN(resultado.pagoOrdinario)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('overtime.double')}</div>
          <div className="value mono accent">{resultado.extraDoble} {t('overtime.hrs')}</div>
          <div className="label mono">{formatMXN(resultado.pagoDoble)}</div>
        </div>
        <div className="stat">
          <div className="label">{t('overtime.triple')}</div>
          <div className="value mono accent">{resultado.extraTriple} {t('overtime.hrs')}</div>
          <div className="label mono">{formatMXN(resultado.pagoTriple)}</div>
        </div>
      </div>

      {resultado.excedeLimiteLegal && (
        <div className="stat" style={{ marginTop: 14, borderColor: 'var(--danger)' }}>
          <div className="label">{t('overtime.excess')}</div>
          <div className="value warn mono">{resultado.excedente} {t('overtime.hrs')} · {formatMXN(resultado.pagoExcedente)}</div>
        </div>
      )}

      <div className="stat" style={{ marginTop: 14, background: 'transparent', border: '1px solid var(--accent)' }}>
        <div className="label">{t('overtime.weekTotal')}</div>
        <div className="value accent mono" style={{ fontSize: '1.3rem' }}>{formatMXN(resultado.total_pago)}</div>
      </div>

      {nDias > 0 && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border-soft)', paddingTop: 12 }}>
          <p className="card-title">{t('overtime.verifyTitle')}</p>
          <p className="card-sub">
            {t('overtime.daysLoaded')(nDias, 7)}
            {nDias < 7 && ` · ${t('overtime.partialNote')}`}
          </p>
          <div className="grid cols-3">
            <div className="stat">
              <div className="label">{t('overtime.worked')}</div>
              <div className="value mono">{fmtDuracion(openMin)}</div>
            </div>
            <div className="stat">
              <div className="label">{t('overtime.extraHrs')}</div>
              <div className="value mono accent">{fmtDuracion(extMin)}</div>
            </div>
            <div className="stat" style={{ borderColor: 'var(--accent)' }}>
              <div className="label">{t('overtime.totalSched')}</div>
              <div className="value mono accent">{fmtDuracion(totalMin)}</div>
            </div>
          </div>
          <div className="grid cols-3" style={{ marginTop: 10 }}>
            <div className="stat">
              <div className="label">{t('overtime.totalDecimal')}</div>
              <div className="value mono">{totalSched} {t('overtime.hrs')}</div>
            </div>
            <div className="stat">
              <div className="label">{t('overtime.target')}</div>
              <div className="value mono">{META_SEMANAL_HRS} {t('overtime.hrs')}</div>
            </div>
            <div className="stat" style={{ borderColor: diffMin === 0 ? 'var(--online)' : 'var(--danger)' }}>
              <div className="label">{t('overtime.diff')}</div>
              <div className="value mono" style={{ color: diffMin === 0 ? 'var(--online)' : 'var(--danger)', fontSize: '0.95rem' }}>
                {diffMin === 0 ? t('overtime.matchesTarget') : `${diffMin > 0 ? '+' : ''}${fmtDuracion(diffMin)}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OvertimeCalculator() {
  const { horasPorSemana, setHorasDia, undertimePorSemana, setUndertimeDia, horarios, setHorario, removeHorario } = useAppData()
  const { t, lang } = useLanguage()
  const hoy = todayISO()
  const [indice, setIndice] = useState(indiceQuincenaTrabajada(hoy))

  const quincena = useMemo(() => quincenaTrabajadaPorIndice(indice), [indice])
  const diasPeriodo = useMemo(() => diasDeQuincena(quincena.start, quincena.end), [quincena.start, quincena.end])

  // Horas efectivas del día = horas capturadas − undertime (nunca menos de 0)
  const efectivas = (horas, under) => horas.map((h, i) => Math.max(0, redondear2((Number(h) || 0) - (Number(under[i]) || 0))))

  // Una quincena (13–16 días) toca de 3 a 4 semanas lunes–domingo; la primera y la
  // última pueden quedar partidas. Cada semana paga solo los días de esta quincena.
  const semanas = useMemo(() => {
    const dif = (a, b) => Math.round((parseISODate(a) - parseISODate(b)) / 86400000)
    return semanasQueTocan(quincena.start, quincena.end).map((weekStart, n) => {
      const horas = horasPorSemana[weekStart] || [0, 0, 0, 0, 0, 0, 0]
      const under = undertimePorSemana[weekStart] || [0, 0, 0, 0, 0, 0, 0]
      const desde = Math.max(0, dif(quincena.start, weekStart))
      const hasta = Math.min(6, dif(quincena.end, weekStart))
      return { n: n + 1, weekStart, horas, under, resultado: calcularSemanaParcial(efectivas(horas, under), weekStart, desde, hasta) }
    })
  }, [quincena.start, quincena.end, horasPorSemana, undertimePorSemana])

  // Guarda el horario leído y llena las horas del día con Open + Schedule Extension.
  function aplicarHorario(fechaISO, rows) {
    setHorario(fechaISO, rows)
    const semana = startOfWeekMonday(fechaISO)
    const idx = Math.round((parseISODate(fechaISO) - parseISODate(semana)) / 86400000)
    setHorasDia(semana, idx, Math.round((totalesHorario(rows).trabajado / 60) * 10000) / 10000)
  }

  const totalQuincena = semanas.reduce((a, w) => a + w.resultado.total_pago, 0)
  const totalHoras = redondear2(semanas.reduce((a, w) => a + w.resultado.total, 0))

  return (
    <div>
      <div className="card ticket" style={{ borderColor: 'var(--accent)' }}>
        <p className="pill current">{quincena.index === indiceQuincenaTrabajada(hoy) ? t('overtime.currentBiweek') : t('overtime.biweek')}</p>
        <h2 className="display" style={{ margin: '10px 0 2px' }}>
          {formatShort(quincena.start, lang)} – {formatShort(quincena.end, lang)}
        </h2>
        <p className="card-sub" style={{ marginBottom: 14 }}>{t('overtime.paidOn')} {formatLong(quincena.payDate, lang)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => setIndice((k) => k - 1)}>{t('overtime.prevBiweek')}</button>
          <div className="grid cols-2" style={{ flex: 1 }}>
            <div className="stat">
              <div className="label">{t('overtime.totalHours')}</div>
              <div className="value mono">{totalHoras} {t('overtime.hrs')}</div>
            </div>
            <div className="stat" style={{ borderColor: 'var(--accent)' }}>
              <div className="label">{t('overtime.totalToPay')}</div>
              <div className="value accent mono">{formatMXN(totalQuincena)}</div>
            </div>
          </div>
          <button className="btn" onClick={() => setIndice((k) => k + 1)}>{t('overtime.nextBiweek')}</button>
        </div>
      </div>

      <ScheduleCapture
        dias={diasPeriodo}
        horarios={horarios}
        onSave={aplicarHorario}
        onRemove={removeHorario}
        lang={lang}
        t={t}
      />

      {semanas.map((w) => (
        <BloqueSemana
          key={w.weekStart}
          titulo={t('overtime.weekN')(w.n)}
          weekStart={w.weekStart}
          inicio={quincena.start}
          fin={quincena.end}
          horas={w.horas}
          undertime={w.under}
          onUndertime={(i, v) => setUndertimeDia(w.weekStart, i, v)}
          horarios={horarios}
          resultado={w.resultado}
          onChange={(i, v) => setHorasDia(w.weekStart, i, v)}
          lang={lang}
          t={t}
        />
      ))}
    </div>
  )
}
