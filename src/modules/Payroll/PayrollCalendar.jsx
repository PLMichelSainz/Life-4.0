import { useMemo } from 'react'
import { listaCatorcenas } from '../../utils/payroll'
import { useLanguage } from '../../context/LanguageContext'
import { todayISO, formatShort, formatLong } from '../../utils/dates'

export default function PayrollCalendar() {
  const { t, lang } = useLanguage()
  const hoy = todayISO()
  const catorcenas = useMemo(() => listaCatorcenas(hoy, 2, 4), [hoy])
  const actual = catorcenas.find((c) => c.esActual)

  return (
    <div>
      <div className="card ticket" style={{ borderColor: 'var(--accent)' }}>
        <p className="pill current">{t('payroll.currentBiweek')}</p>
        <h2 className="display" style={{ margin: '10px 0 2px' }}>
          {formatShort(actual.start, lang)} – {formatShort(actual.end, lang)}
        </h2>
        <p className="card-sub" style={{ marginBottom: 0 }}>
          {t('payroll.payDay')} <b>{formatLong(actual.payDate, lang)}</b>
        </p>
      </div>

      <div className="card">
        <p className="card-title">{t('payroll.upcoming')}</p>
        <p className="card-sub">{t('payroll.description')}</p>
        {catorcenas.map((c) => (
          <div className="day-row" key={c.index}>
            <div>
              <div className="day-name">
                {formatShort(c.start, lang)} – {formatShort(c.end, lang)}
                {c.esActual && <span className="pill current" style={{ marginLeft: 8 }}>{t('common.current')}</span>}
              </div>
              <div className="day-date">{t('payroll.pay')} {formatLong(c.payDate, lang)}</div>
            </div>
            <span className="pill mono">#{c.index}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
