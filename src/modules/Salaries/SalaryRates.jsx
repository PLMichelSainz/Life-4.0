import { useState, useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { formatMXN } from '../../utils/overtime'
import { calcularISRPeriodo } from '../../utils/isr'
import { calcularIMSSObreroPeriodo } from '../../utils/imss'

const DIAS_CATORCENA = 14
const SEMANAS_CATORCENA = 2
const JORNADAS_WH = [35, 40, 42, 46]

// Deducciones que no tienen una tasa fija oficial (dependen del crédito, del
// juzgado o del contrato colectivo de cada quien), solo se muestran como
// referencia para que el usuario capture la suya propia abajo.
const GUIA_OTRAS_DEDUCCIONES = [
  { nombre: 'Infonavit (crédito de vivienda)', rango: 'Normalmente 20%, 25% o 30% del sueldo, según el descuento que elegiste al tramitar el crédito.' },
  { nombre: 'Fonacot', rango: 'Cuota fija definida en tu contrato de crédito (comúnmente 10%–30% del sueldo).' },
  { nombre: 'Pensión alimenticia', rango: 'La fija un juez; suele ir de 15% a 30% del salario o ingreso neto.' },
  { nombre: 'Cuota sindical', rango: 'Si tu contrato colectivo la contempla, suele ser 1%–2% del salario.' },
]

function calcularDeduccionExtra(deduccion, bruto) {
  if (deduccion.tipo === 'porcentaje') return (bruto * (Number(deduccion.valor) || 0)) / 100
  return Number(deduccion.valor) || 0
}

export default function SalaryRates() {
  const { tarifaPorHora, setTarifaPorHora, otrasDeducciones, addDeduccion, removeDeduccion } = useAppData()
  const [tarifaInput, setTarifaInput] = useState(String(tarifaPorHora))
  const [nombreDed, setNombreDed] = useState('')
  const [tipoDed, setTipoDed] = useState('porcentaje')
  const [valorDed, setValorDed] = useState('')

  const filas = useMemo(() => {
    return JORNADAS_WH.map((wh) => {
      const bruto = tarifaPorHora * wh * SEMANAS_CATORCENA
      const sbcDiarioAprox = bruto / DIAS_CATORCENA
      const { isrNeto } = calcularISRPeriodo(bruto, DIAS_CATORCENA)
      const imss = calcularIMSSObreroPeriodo(sbcDiarioAprox, DIAS_CATORCENA)
      const extras = otrasDeducciones.reduce((a, d) => a + calcularDeduccionExtra(d, bruto), 0)
      const neto = Math.max(0, bruto - isrNeto - imss - extras)
      return { wh, bruto, isr: isrNeto, imss, extras, neto }
    })
  }, [tarifaPorHora, otrasDeducciones])

  function guardarTarifa(e) {
    e.preventDefault()
    const valor = Number(tarifaInput)
    if (!valor || valor <= 0) return
    setTarifaPorHora(valor)
  }

  function agregarDeduccion(e) {
    e.preventDefault()
    if (!nombreDed.trim() || !valorDed) return
    addDeduccion(nombreDed.trim(), tipoDed, valorDed)
    setNombreDed('')
    setValorDed('')
  }

  return (
    <div>
      <div className="card">
        <p className="card-title">Tarifa por hora</p>
        <form onSubmit={guardarTarifa} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Tarifa por hora (MXN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={tarifaInput}
              onChange={(e) => setTarifaInput(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <button type="submit" className="btn primary">Guardar</button>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Salario por catorcena, según horas semanales (WH)</p>
        <p className="card-sub">Catorcena = 2 semanas. Tarifa actual: {formatMXN(tarifaPorHora)}/hora.</p>

        {filas.map((f) => (
          <div key={f.wh} style={{ marginBottom: 16 }}>
            <div className="day-name" style={{ marginBottom: 6 }}>{f.wh} WH</div>
            <div className="grid cols-2">
              <div className="stat">
                <div className="label">Bruto (sin deducciones)</div>
                <div className="value mono">{formatMXN(f.bruto)}</div>
              </div>
              <div className="stat" style={{ borderColor: 'var(--accent)' }}>
                <div className="label">Neto (con todas las deducciones)</div>
                <div className="value accent mono">{formatMXN(f.neto)}</div>
              </div>
            </div>
            <div className="grid cols-3" style={{ marginTop: 8 }}>
              <div className="stat">
                <div className="label">ISR retenido</div>
                <div className="value mono" style={{ color: 'var(--danger)' }}>-{formatMXN(f.isr)}</div>
              </div>
              <div className="stat">
                <div className="label">IMSS (cuota obrera est.)</div>
                <div className="value mono" style={{ color: 'var(--danger)' }}>-{formatMXN(f.imss)}</div>
              </div>
              <div className="stat">
                <div className="label">Otras deducciones</div>
                <div className="value mono" style={{ color: 'var(--danger)' }}>-{formatMXN(f.extras)}</div>
              </div>
            </div>
          </div>
        ))}

        <p className="card-sub" style={{ marginTop: 4, marginBottom: 0 }}>
          ISR estimado con la tarifa oficial 2026 (Art. 96 LISR) prorateada a 14 días. IMSS estimado con las cuotas
          obreras fijas de ley (2.375% del SBC + 0.40% sobre el excedente de 3 UMA, UMA diaria 2026: {formatMXN(117.31)}),
          usando el salario bruto entre 14 como aproximación de tu SBC diario — puede variar si tu SBC real integra
          aguinaldo/prima vacacional. El monto real también puede cambiar por bonos u otras percepciones.
        </p>
      </div>

      <div className="card">
        <p className="card-title">Otras deducciones</p>
        <p className="card-sub">
          Infonavit, Fonacot, pensión alimenticia y cuota sindical no tienen una tasa única oficial: dependen de tu
          crédito, tu contrato o una orden judicial. Agrega aquí la tuya (como % de tu sueldo bruto o como monto fijo
          por catorcena) y se descontará arriba en cada fila.
        </p>

        <div style={{ marginBottom: 14 }}>
          {GUIA_OTRAS_DEDUCCIONES.map((g) => (
            <div key={g.nombre} className="day-row">
              <div>
                <div className="day-name">{g.nombre}</div>
                <div className="day-date">{g.rango}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={agregarDeduccion} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label>Nombre</label>
            <input type="text" value={nombreDed} onChange={(e) => setNombreDed(e.target.value)} placeholder="Ej. Infonavit" />
          </div>
          <div style={{ width: 140 }}>
            <label>Tipo</label>
            <select value={tipoDed} onChange={(e) => setTipoDed(e.target.value)}>
              <option value="porcentaje">% del bruto</option>
              <option value="monto">Monto fijo</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label>{tipoDed === 'porcentaje' ? 'Valor (%)' : 'Valor (MXN)'}</label>
            <input type="number" min="0" step="0.01" value={valorDed} onChange={(e) => setValorDed(e.target.value)} placeholder="0" />
          </div>
          <button type="submit" className="btn primary">Agregar</button>
        </form>

        {otrasDeducciones.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {otrasDeducciones.map((d) => (
              <div className="day-row" key={d.id}>
                <div>
                  <div className="day-name">{d.nombre}</div>
                  <div className="day-date">{d.tipo === 'porcentaje' ? `${d.valor}% del bruto` : formatMXN(d.valor)}</div>
                </div>
                <button className="btn danger" onClick={() => removeDeduccion(d.id)}>Quitar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
