import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useLanguage } from '../../context/LanguageContext'
import { addDays, formatShort, formatLong, dayName, todayISO } from '../../utils/dates'
import { calcularSemana, formatMXN, LIMITE_LEGAL_SEMANAL } from '../../utils/overtime'
import { indiceCatorcena, catorcenaPorIndice } from '../../utils/payroll'

function BloqueSemana({ titulo, weekStart, horas, onChange, resultado, lang, t }) {
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
              <div className="day-name">{dayName(fecha, false, lang)}</div>
              <div className="day-date">{formatShort(fecha, lang)}</div>
            </div>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              style={{ maxWidth: 110 }}
              value={horas[i] === 0 ? '' : horas[i]}
              placeholder="0"
              onChange={(e) => onChange(i, Number(e.target.value) || 0)}
            />
          </div>
        )
      })}

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
    </div>
  )
}

export default function OvertimeCalculator() {
  const { horasPorSemana, setHorasDia } = useAppData()
  const { t, lang } = useLanguage()
  const hoy = todayISO()
  const [indice, setIndice] = useState(indiceCatorcena(hoy))

  const catorcena = useMemo(() => catorcenaPorIndice(indice), [indice])
  const week1Start = catorcena.start
  const week2Start = addDays(catorcena.start, 7)

  const horas1 = horasPorSemana[week1Start] || [0, 0, 0, 0, 0, 0, 0]
  const horas2 = horasPorSemana[week2Start] || [0, 0, 0, 0, 0, 0, 0]

  const resultado1 = useMemo(() => calcularSemana(horas1, week1Start), [horas1, week1Start])
  const resultado2 = useMemo(() => calcularSemana(horas2, week2Start), [horas2, week2Start])

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

      <BloqueSemana
        titulo={t('overtime.week1')}
        weekStart={week1Start}
        horas={horas1}
        resultado={resultado1}
        onChange={(i, v) => setHorasDia(week1Start, i, v)}
        lang={lang}
        t={t}
      />
      <BloqueSemana
        titulo={t('overtime.week2')}
        weekStart={week2Start}
        horas={horas2}
        resultado={resultado2}
        onChange={(i, v) => setHorasDia(week2Start, i, v)}
        lang={lang}
        t={t}
      />
    </div>
  )
}
