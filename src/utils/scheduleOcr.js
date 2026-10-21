// Lector (OCR) de capturas de horario con varias pasadas.
//
// Una sola lectura no es confiable: según cómo se escale/procese la imagen, el lector
// se salta filas al azar (a veces un Client Training, a veces un Open). Por eso:
//  1. se lee con tratamientos de imagen distintos (pasadas);
//  2. las filas se combinan por votos (fusionarPasadas);
//  3. se sigue con más pasadas mientras queden huecos/encimes o las pasadas no coincidan.
import { parseHorarioTexto, fusionarPasadas, huecos, solapes } from './schedule'

// Orden de las pasadas, según mediciones sobre capturas reales deformadas (tamaños y JPEG):
//  gris     : solo gris, sin invertir          (la mejor: 17/28 perfectas en solitario)
//  gris-inv : gris invertido si es oscuro      (16/28)
//  color    : invertido en color, sin gris     (8/28, pero falla en filas distintas)
//  umbral   : binarizado (Otsu)                (9/28, también falla en filas distintas)
// Ninguna es confiable sola; lo que importa es que sus errores NO coinciden y se compensan.
export const VARIANTES = ['gris', 'gris-inv', 'color', 'umbral']
const MIN_PASADAS = 2

export const escalaPara = (ancho) => (ancho < 1400 ? 2 : 1)

function aGris(d) {
  let suma = 0
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = g
    suma += g
  }
  return suma / (d.length / 4)
}

function invertir(d, conGris = true) {
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i]
    d[i + 1] = conGris ? d[i] : 255 - d[i + 1]
    d[i + 2] = conGris ? d[i] : 255 - d[i + 2]
  }
}

// Umbral de Otsu sobre un canal de gris (0-255)
function umbralOtsu(d) {
  const hist = new Array(256).fill(0)
  for (let i = 0; i < d.length; i += 4) hist[Math.round(d[i])] += 1
  const total = d.length / 4
  let sumaTotal = 0
  for (let t = 0; t < 256; t++) sumaTotal += t * hist[t]
  let sumaB = 0
  let pesoB = 0
  let mejorVar = -1
  let umbral = 128
  for (let t = 0; t < 256; t++) {
    pesoB += hist[t]
    if (!pesoB) continue
    const pesoF = total - pesoB
    if (!pesoF) break
    sumaB += t * hist[t]
    const dif = sumaB / pesoB - (sumaTotal - sumaB) / pesoF
    const varianza = pesoB * pesoF * dif * dif
    if (varianza > mejorVar) {
      mejorVar = varianza
      umbral = t
    }
  }
  return umbral
}

/** Aplica el tratamiento `variante` a los píxeles RGBA (Uint8ClampedArray), en sitio. */
export function aplicarVariante(d, variante) {
  if (variante === 'color') {
    let suma = 0
    for (let i = 0; i < d.length; i += 4) suma += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    if (suma / (d.length / 4) < 128) invertir(d, false)
    return
  }
  const media = aGris(d)
  const oscuro = media < 128
  if (variante === 'gris') return
  if (oscuro) invertir(d, true)
  if (variante === 'umbral') {
    const t = umbralOtsu(d)
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = d[i] > t ? 255 : 0
  }
}

// ---- entorno del navegador (en las pruebas se sustituye) ----
let workerPromise = null

async function obtenerWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker('eng', 1, { langPath: '/tessdata', gzip: false })
    })().catch((err) => {
      workerPromise = null
      throw err
    })
  }
  return workerPromise
}

export async function terminarOcr() {
  if (!workerPromise) return
  try {
    const w = await workerPromise
    await w.terminate()
  } catch {
    /* nada que limpiar */
  }
  workerPromise = null
}

export const entornoNavegador = {
  async cargar(blob) {
    return createImageBitmap(blob)
  },
  preparar(bmp, variante) {
    const escala = escalaPara(bmp.width)
    const canvas = document.createElement('canvas')
    canvas.width = bmp.width * escala
    canvas.height = bmp.height * escala
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    aplicarVariante(img.data, variante)
    ctx.putImageData(img, 0, 0)
    return canvas
  },
  async reconocer(canvas) {
    const worker = await obtenerWorker()
    const { data } = await worker.recognize(canvas)
    return data.text
  },
}

const claveFilas = (filas) =>
  [...filas].sort((a, b) => a.s - b.s).map((f) => `${f.s}-${f.e}-${f.c}`).join('|')

const masFrecuente = (valores) => {
  const cuenta = {}
  valores.forEach((v) => {
    cuenta[v] = (cuenta[v] || 0) + 1
  })
  return Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a])[0] || null
}

/**
 * Lee una captura con varias pasadas y devuelve { fecha, filas, pasadas, confiable, completa }.
 * `completa`  = sin huecos, sin encimes y sin líneas de actividad que se hayan visto pero no leído.
 * `confiable` = completa y al menos 2 pasadas coinciden exactamente con el resultado.
 */
export async function leerHorarioImagen(blob, onPasada, env = entornoNavegador) {
  const origen = await env.cargar(blob)
  const pasadas = []
  const fechas = []
  let fusion = []
  let confiable = false
  let completa = false
  let esperadasMax = 0 // filas + líneas dudosas de la pasada que más actividades "vio"

  for (let i = 0; i < VARIANTES.length; i++) {
    if (onPasada) onPasada(i + 1, VARIANTES.length)
    const lienzo = env.preparar(origen, VARIANTES[i])
    const texto = await env.reconocer(lienzo)
    const r = parseHorarioTexto(texto)
    if (r.fecha) fechas.push(r.fecha)
    if (r.filas.length) pasadas.push(r.filas.map(({ c, s, e }) => ({ c, s, e })))
    esperadasMax = Math.max(esperadasMax, r.filas.length + r.dudosas)

    fusion = fusionarPasadas(pasadas)
    // completa = sin huecos, sin encimes y sin actividades "vistas" que no lograron entrar al resultado
    completa =
      fusion.length > 0 && !huecos(fusion).length && !solapes(fusion).length && fusion.length >= esperadasMax
    const objetivo = claveFilas(fusion)
    const coinciden = pasadas.filter((p) => claveFilas(p) === objetivo).length
    confiable = completa && coinciden >= MIN_PASADAS
    if (confiable) break
  }
  return { fecha: masFrecuente(fechas), filas: fusion, pasadas: pasadas.length, confiable, completa }
}
