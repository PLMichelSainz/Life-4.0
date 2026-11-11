import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { addDays, formatShort, formatLong, dayName, todayISO, parseISODate, startOfWeekMonday } from '../../utils/dates'
import { calcularSemana, formatMXN, LIMITE_LEGAL_SEMANAL } from '../../utils/overtime'
import { indiceCatorcena, catorcenaPorIndice } from '../../utils/payroll'
import { totalesHorario, minAHoras, fmtDuracion, META_SEMANAL_HRS } from '../../utils/schedule'
import ScheduleCapture from './ScheduleCapture'
import DraftNumber from '../../components/DraftNumber'

const redondear2 = (n) => Math.round(n * 100) / 100

function BloqueSemana({ titulo, weekStart, horas, onChange, undertime, onUndertime, horarios, resultado, lang, t }) {
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
        return (
          <div className="day-row" key={fecha}>
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
  const [indice, setIndice] = useState(indiceCatorcena(hoy))

  const catorcena = useMemo(() => catorcenaPorIndice(indice), [indice])
  const week1Start = catorcena.start
  const week2Start = addDays(catorcena.start, 7)

  const horas1 = horasPorSemana[week1Start] || [0, 0, 0, 0, 0, 0, 0]
  const horas2 = horasPorSemana[week2Start] || [0, 0, 0, 0, 0, 0, 0]

  const under1 = undertimePorSemana[week1Start] || [0, 0, 0, 0, 0, 0, 0]
  const under2 = undertimePorSemana[week2Start] || [0, 0, 0, 0, 0, 0, 0]

  // Horas efectivas del día = horas capturadas − undertime (nunca menos de 0)
  const efectivas = (horas, under) => horas.map((h, i) => Math.max(0, redondear2((Number(h) || 0) - (Number(under[i]) || 0))))

  const resultado1 = useMemo(() => calcularSemana(efectivas(horas1, under1), week1Start), [horas1, under1, week1Start])
  const resultado2 = useMemo(() => calcularSemana(efectivas(horas2, under2), week2Start), [horas2, under2, week2Start])

  const dias14 = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(catorcena.start, i)), [catorcena.start])

  // Guarda el horario leído y llena las horas del día con Open + Schedule Extension.
  function aplicarHorario(fechaISO, rows) {
    setHorario(fechaISO, rows)
    const semana = startOfWeekMonday(fechaISO)
    const idx = Math.round((parseISODate(fechaISO) - parseISODate(semana)) / 86400000)
    setHorasDia(semana, idx, Math.round((totalesHorario(rows).trabajado / 60) * 10000) / 10000)
  }

  const totalCatorcena = resultado1.total_pago + resultado2.total_pago
  const totalHoras = resultado1.total + resultado2.total

  return (
    <div>
      <div className="card ticket" style={{ borderColor: 'var(--accent)' }}>
        <p className="pill current">{catorcena.index === indiceCatorcena(hoy) ? t('overtime.currentBiweek') : t('overtime.biweek')}</p>
        <h2 className="display" style={{ margin: '10px 0 2px' }}>
          {formatShort(catorcena.start, lang)} – {formatShort(catorcena.end, lang)}
        </h2>
        <p className="card-sub" style={{ marginBottom: 14 }}>{t('overtime.paidOn')} {formatLong(catorcena.payDate, lang)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => setIndice((k) => k - 1)}>{t('overtime.prevBiweek')}</button>
          <div className="grid cols-2" style={{ flex: 1 }}>
            <div className="stat">
              <div className="label">{t('overtime.totalHours')}</div>
              <div className="value mono">{totalHoras} {t('overtime.hrs')}</div>
            </div>
            <div className="stat" style={{ borderColor: 'var(--accent)' }}>
              <div className="label">{t('overtime.totalToPay')}</div>
              <div className="value accent mono">{formatMXN(totalCatorcena)}</div>
            </div>
          </div>
          <button className="btn" onClick={() => setIndice((k) => k + 1)}>{t('overtime.nextBiweek')}</button>
        </div>
      </div>

      <ScheduleCapture
        dias={dias14}
        horarios={horarios}
        onSave={aplicarHorario}
        onRemove={removeHorario}
        lang={lang}
        t={t}
      />

      <BloqueSemana
        titulo={t('overtime.week1')}
        weekStart={week1Start}
        horas={horas1}
        undertime={under1}
        onUndertime={(i, v) => setUndertimeDia(week1Start, i, v)}
        horarios={horarios}
        resultado={resultado1}
        onChange={(i, v) => setHorasDia(week1Start, i, v)}
        lang={lang}
        t={t}
      />
      <BloqueSemana
        titulo={t('overtime.week2')}
        weekStart={week2Start}
        horas={horas2}
        undertime={under2}
        onUndertime={(i, v) => setUndertimeDia(week2Start, i, v)}
        horarios={horarios}
        resultado={resultado2}
        onChange={(i, v) => setHorasDia(week2Start, i, v)}
        lang={lang}
        t={t}
      />
    </div>
  )
}
