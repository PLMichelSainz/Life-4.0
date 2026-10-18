// Utilidades puras para interpretar el texto leído (OCR) de una captura del
// horario diario. Todo se maneja en minutos desde la medianoche.

export const META_SEMANAL_HRS = 46

const MESES = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

// Clases de actividad. Cuentan como tiempo trabajado SOLO: open, ext (Schedule Extension)
// y train (Client Training, en cualquiera de sus variantes). El Under Time jamás se suma;
// Wellness Break y Lunch Break (break) tampoco.
export const CLASES = ['open', 'ext', 'train', 'ut', 'break', 'other']

export function clasificar(textoActividad) {
  const t = String(textoActividad || '').toLowerCase().replace(/[^a-z ]/g, ' ')
  if (/exten|sched/.test(t)) return 'ext'
  if (/under|undert/.test(t)) return 'ut'
  if (/break|lunch|well|ness|meal/.test(t)) return 'break'
  // Client Training y cualquier variante ("Client Training - X", "Client Trng", lecturas con ruido)
  if (/train|trng|tr\w*n\w*ng/.test(t)) return 'train'
  if (/(^|[^a-z])[o0]p[eao]n([^a-z]|$)/.test(String(textoActividad || '').toLowerCase())) return 'open'
  return 'other'
}

function aMinutos(h, m, ampm) {
  let hh = Number(h) % 12
  if (/p/i.test(ampm)) hh += 12
  return hh * 60 + Number(m)
}

const RE_HORA = /(\d{1,2}):(\d{2})\s*([AP])\.?\s*M/gi

// Devuelve { fecha: 'YYYY-MM-DD' | null, filas: [{ c, s, e, raw }] }
export function parseHorarioTexto(texto) {
  const lineas = String(texto || '').split(/\r?\n/)
  let fecha = null
  const filas = []

  for (const linea of lineas) {
    if (!fecha) {
      const m = linea.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(20\d{2})/)
      if (m && MESES[m[1].toLowerCase()]) {
        const mes = String(MESES[m[1].toLowerCase()]).padStart(2, '0')
        fecha = `${m[3]}-${mes}-${String(Number(m[2])).padStart(2, '0')}`
        continue
      }
    }
    const horas = [...linea.matchAll(RE_HORA)]
    if (horas.length < 2) continue
    const actividad = linea.slice(0, horas[0].index)
    const s = aMinutos(horas[0][1], horas[0][2], horas[0][3])
    let e = aMinutos(horas[1][1], horas[1][2], horas[1][3])
    if (e <= s) e += 24 * 60 // cruza la medianoche
    filas.push({ c: clasificar(actividad), s, e, raw: actividad.trim() })
  }
  return { fecha, filas }
}

export function totalesHorario(filas) {
  const t = { open: 0, ext: 0, train: 0, ut: 0, break: 0, other: 0 }
  for (const f of filas || []) t[f.c] = (t[f.c] || 0) + Math.max(0, f.e - f.s)
  return { ...t, trabajado: t.open + t.ext + t.train }
}

// Huecos entre filas consecutivas (posible fila que no se pudo leer).
export function huecos(filas) {
  const ord = [...(filas || [])].sort((a, b) => a.s - b.s)
  const out = []
  for (let i = 1; i < ord.length; i++) {
    const gap = ord[i].s - ord[i - 1].e
    if (gap > 0) out.push({ desde: ord[i - 1].e, hasta: ord[i].s, min: gap })
  }
  return out
}

// Filas encimadas (p. ej. una fila leída dos veces): también hacen que la suma no cuadre.
export function solapes(filas) {
  const ord = [...(filas || [])].sort((a, b) => a.s - b.s)
  const out = []
  for (let i = 1; i < ord.length; i++) {
    const solape = ord[i - 1].e - ord[i].s
    if (solape > 0) out.push({ desde: ord[i].s, hasta: Math.min(ord[i - 1].e, ord[i].e), min: solape })
  }
  return out
}

// Duración con lógica de reloj: 390 -> "6 h 30 min" (no 6.5 h). Con signo si es negativa.
export function fmtDuracion(min) {
  const neg = min < 0
  const total = Math.round(Math.abs(min))
  const h = Math.floor(total / 60)
  const m = total % 60
  const txt = h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`
  return neg ? `−${txt}` : txt
}

export function fmtHora(min) {
  const m = ((min % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const mm = String(m % 60).padStart(2, '0')
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(h12).padStart(2, '0')}:${mm} ${ampm}`
}

// "HH:MM" (24 h, para <input type="time">) <-> minutos
export function minAHHMM(min) {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
export function hhmmAMin(valor) {
  const [h, m] = String(valor || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export const minAHoras = (min) => Math.round((min / 60) * 100) / 100
