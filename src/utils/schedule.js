// Utilidades puras para interpretar el texto leído (OCR) de una captura del
// horario diario. Todo se maneja en minutos desde la medianoche.

export const META_SEMANAL_HRS = 46

const MESES = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

// Clases de actividad. Cuentan como tiempo trabajado SOLO: open, ext (Schedule Extension)
// y train (Client Training en cualquiera de sus variantes, y NPS: tiempo laborado igual que Open). El Under Time jamás se suma;
// Wellness Break y Lunch Break (break) tampoco.
export const CLASES = ['open', 'ext', 'train', 'ut', 'break', 'other']

export function clasificar(textoActividad) {
  const t = String(textoActividad || '').toLowerCase().replace(/[^a-z ]/g, ' ')
  if (/exten|sched/.test(t)) return 'ext'
  if (/under|undert/.test(t)) return 'ut'
  if (/break|lunch|well|ness|meal/.test(t)) return 'break'
  // Client Training y cualquier variante ("Client Training - X", "Client Trng", lecturas con ruido)
  if (/train|trng|tr\w*n\w*ng/.test(t)) return 'train'
  // NPS (con ruido de lectura: "N PS", "NP5", "NPS Survey"...) cuenta como tiempo laborado
  if (/(^|[^a-z0-9])n\s?p[s5]([^a-z0-9]|$)/.test(String(textoActividad || '').toLowerCase())) return 'train'
  if (/(^|[^a-z])[o0]p[eao]n([^a-z]|$)/.test(String(textoActividad || '').toLowerCase())) return 'open'
  return 'other'
}

// El lector confunde a veces "0" con "O" y "1" con "l"/"I": se corrige solo dentro de una hora.
const limpiarDigitos = (txt) => String(txt).replace(/[Oo]/g, '0').replace(/[Il]/g, '1')

function aMinutos(h, m, ampm) {
  const hora = Number(limpiarDigitos(h))
  const min = Number(limpiarDigitos(m))
  if (!(hora >= 1 && hora <= 12) || !(min >= 0 && min <= 59)) return null // lectura basura: se descarta
  let hh = hora % 12
  if (/p/i.test(ampm)) hh += 12
  return hh * 60 + min
}

// separador de la hora: ":" normalmente, pero el lector a veces devuelve ".", "-" o ";"
const RE_HORA = /([0-9OoIl]{1,2})[:.\-;]([0-9OoIl]{2})\s*([AaPp])\.?\s*[MmNn]/g
// Líneas que parecen una actividad con hora aunque no se haya podido leer completa
const RE_PARECE_ACTIVIDAD = /open|break|lunch|wellness|train|trng|extension|schedule|under\s?time|nps/i

// Devuelve { fecha: 'YYYY-MM-DD' | null, filas: [{ c, s, e, raw }] }
export function parseHorarioTexto(texto) {
  const lineas = String(texto || '').split(/\r?\n/)
  let fecha = null
  const filas = []
  let dudosas = 0 // líneas que parecían una actividad con hora pero no se pudieron leer completas

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
      .map((m) => ({ m, min: aMinutos(m[1], m[2], m[3]) }))
      .filter((x) => x.min !== null)
    if (horas.length < 2) {
      if (RE_PARECE_ACTIVIDAD.test(linea) && /[AaPp]\s*[Mm]/.test(linea) && /\d/.test(linea)) dudosas += 1
      continue
    }
    const actividad = linea.slice(0, horas[0].m.index)
    const s = horas[0].min
    let e = horas[1].min
    if (e <= s) e += 24 * 60 // cruza la medianoche
    filas.push({ c: clasificar(actividad), s, e, raw: actividad.trim() })
  }
  return { fecha, filas, dudosas }
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

const PRIORIDAD_CLASE = ['train', 'ext', 'open', 'ut', 'break', 'other']

/**
 * Combina las filas leídas en varias pasadas de la MISMA imagen. Cada fila (mismo inicio y fin)
 * recibe un voto por pasada que la leyó; si hay filas que se encíman por una lectura equivocada,
 * se queda la combinación sin encimes con más votos (y, a igualdad, la que cubre más tiempo).
 * Así, una fila que una pasada se saltó se recupera de otra.
 */
export function fusionarPasadas(pasadas) {
  const mapa = new Map()
  for (const filas of pasadas) {
    const vistas = new Set()
    for (const f of filas) {
      const k = `${f.s}-${f.e}`
      if (vistas.has(k)) continue
      vistas.add(k)
      const x = mapa.get(k) || { s: f.s, e: f.e, votos: 0, clases: {} }
      x.votos += 1
      x.clases[f.c] = (x.clases[f.c] || 0) + 1
      mapa.set(k, x)
    }
  }
  const cand = [...mapa.values()].map((x) => {
    const c = Object.keys(x.clases).sort(
      (a, b) => x.clases[b] - x.clases[a] || PRIORIDAD_CLASE.indexOf(a) - PRIORIDAD_CLASE.indexOf(b)
    )[0]
    return { s: x.s, e: x.e, c, peso: x.votos * 100000 + (x.e - x.s) }
  })
  cand.sort((a, b) => a.e - b.e || a.s - b.s)
  // selección de intervalos sin encimes con peso máximo (programación dinámica)
  const n = cand.length
  const mejor = new Array(n + 1).fill(0)
  const previo = new Array(n).fill(-1)
  for (let i = 0; i < n; i++) {
    let j = i - 1
    while (j >= 0 && cand[j].e > cand[i].s) j--
    previo[i] = j
  }
  const tomar = new Array(n).fill(false)
  for (let i = 1; i <= n; i++) {
    const con = cand[i - 1].peso + mejor[previo[i - 1] + 1]
    if (con >= mejor[i - 1]) {
      mejor[i] = con
      tomar[i - 1] = true
    } else {
      mejor[i] = mejor[i - 1]
      tomar[i - 1] = false
    }
  }
  const out = []
  for (let i = n; i > 0; ) {
    if (tomar[i - 1] && cand[i - 1].peso + mejor[previo[i - 1] + 1] === mejor[i]) {
      out.push({ c: cand[i - 1].c, s: cand[i - 1].s, e: cand[i - 1].e })
      i = previo[i - 1] + 1
    } else i -= 1
  }
  return out.sort((a, b) => a.s - b.s)
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
