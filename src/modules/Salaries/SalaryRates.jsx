import { useState, useMemo } from 'react'
import { useConfirm } from '../../components/ConfirmDialog'
import { useAppData } from '../../context/AppDataContext'
import { formatMXN } from '../../utils/overtime'
import { calcularISRPeriodo } from '../../utils/isr'
import { calcularIMSSObreroPeriodo } from '../../utils/imss'
import { DIAS_BASE_MES } from '../../utils/config'

const DIAS_QUINCENA = 15

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
  const pedirConfirmacion = useConfirm()
  const { salarioDiario, setSalarioDiario, otrasDeducciones, addDeduccion, removeDeduccion } = useAppData()
  const [sueldoInput, setSueldoInput] = useState(String(Math.round(salarioDiario * DIAS_BASE_MES * 100) / 100))
  const [nombreDed, setNombreDed] = useState('')
  const [tipoDed, setTipoDed] = useState('porcentaje')
  const [valorDed, setValorDed] = useState('')

  // Una sola fila: la quincena de 15 días (salario diario × 15, se paga el 15 y el último día).
  const q = useMemo(() => {
    const bruto = salarioDiario * DIAS_QUINCENA
    const { isrNeto } = calcularISRPeriodo(bruto, DIAS_QUINCENA)
    const imss = calcularIMSSObreroPeriodo(salarioDiario, DIAS_QUINCENA) // SBC diario ≈ salario diario
    const extras = otrasDeducciones.reduce((a, d) => a + calcularDeduccionExtra(d, bruto), 0)
    const neto = Math.max(0, bruto - isrNeto - imss - extras)
    return { bruto, isr: isrNeto, imss, extras, neto }
  }, [salarioDiario, otrasDeducciones])

  function guardarSueldo(e) {
    e.preventDefault()
    const mensual = Number(sueldoInput)
    if (!mensual || mensual <= 0) return
    setSalarioDiario(mensual / DIAS_BASE_MES)
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
        <p className="card-title">Sueldo bruto mensual</p>
        <form onSubmit={guardarSueldo} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Sueldo bruto mensual (MXN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sueldoInput}
              onChange={(e) => setSueldoInput(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <button type="submit" className="btn primary">Guardar</button>
        </form>
        <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
          Salario diario = mensual ÷ {DIAS_BASE_MES} = <b className="mono">{formatMXN(salarioDiario)}</b>. Se paga por día natural
          (incluye tus días de descanso).
        </p>
      </div>

      <div className="card">
        <p className="card-title">Salario por quincena (15 días)</p>
        <p className="card-sub">Pagos el día 15 y el último día del mes. Salario diario: {formatMXN(salarioDiario)} × {DIAS_QUINCENA}.</p>

        <div className="grid cols-2">
          <div className="stat">
            <div className="label">Bruto (sin deducciones)</div>
            <div className="value mono">{formatMXN(q.bruto)}</div>
          </div>
          <div className="stat" style={{ borderColor: 'var(--accent)' }}>
            <div className="label">Neto (con todas las deducciones)</div>
            <div className="value accent mono">{formatMXN(q.neto)}</div>
          </div>
        </div>
        <div className="grid cols-3" style={{ marginTop: 8 }}>
          <div className="stat">
            <div className="label">ISR retenido</div>
            <div className="value mono" style={{ color: 'var(--danger)' }}>-{formatMXN(q.isr)}</div>
          </div>
          <div className="stat">
            <div className="label">IMSS (cuota obrera est.)</div>
            <div className="value mono" style={{ color: 'var(--danger)' }}>-{formatMXN(q.imss)}</div>
          </div>
          <div className="stat">
            <div className="label">Otras deducciones</div>
            <div className="value mono" style={{ color: 'var(--danger)' }}>-{formatMXN(q.extras)}</div>
          </div>
        </div>
        <div className="grid cols-2" style={{ marginTop: 8 }}>
          <div className="stat">
            <div className="label">Bruto mensual (2 quincenas)</div>
            <div className="value mono">{formatMXN(q.bruto * 2)}</div>
          </div>
          <div className="stat">
            <div className="label">Neto mensual estimado (2 quincenas)</div>
            <div className="value mono">{formatMXN(q.neto * 2)}</div>
          </div>
        </div>

        <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
          ISR estimado con la tarifa oficial 2026 (Art. 96 LISR) prorateada a 15 días. IMSS estimado con las cuotas
          obreras fijas de ley (2.375% del SBC + 0.40% sobre el excedente de 3 UMA, UMA diaria 2026: {formatMXN(117.31)}),
          usando tu salario diario como aproximación de tu SBC diario — puede variar si tu SBC real integra
          aguinaldo/prima vacacional. El monto real también puede cambiar por bonos u otras percepciones.
        </p>
      </div>

      <div className="card">
        <p className="card-title">Otras deducciones</p>
        <p className="card-sub">
          Infonavit, Fonacot, pensión alimenticia y cuota sindical no tienen una tasa única oficial: dependen de tu
          crédito, tu contrato o una orden judicial. Agrega aquí la tuya (como % de tu sueldo bruto o como monto fijo
          por quincena) y se descontará arriba.
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
                <button className="btn danger" onClick={() => pedirConfirmacion(() => removeDeduccion(d.id))}>Quitar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
