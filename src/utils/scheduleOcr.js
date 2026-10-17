// Lector (OCR) de capturas de horario. Usa tesseract.js cargado bajo demanda
// (no pesa en la carga inicial) y el idioma inglés alojado en /tessdata.

let workerPromise = null
let onProgressActual = null

async function obtenerWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker('eng', 1, {
        langPath: '/tessdata',
        gzip: false,
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgressActual) onProgressActual(m.progress)
        },
      })
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

// Escala x2 las imágenes chicas, pasa a gris y, si el fondo es oscuro, invierte
// (el OCR lee mejor texto oscuro sobre fondo claro).
async function preprocesar(blob) {
  const bmp = await createImageBitmap(blob)
  const escala = bmp.width < 1400 ? 2 : 1
  const canvas = document.createElement('canvas')
  canvas.width = bmp.width * escala
  canvas.height = bmp.height * escala
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  let suma = 0
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = g
    suma += g
  }
  const oscuro = suma / (d.length / 4) < 128
  if (oscuro) {
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = 255 - d[i]
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

export async function leerImagen(blob, onProgress) {
  const canvas = await preprocesar(blob)
  const worker = await obtenerWorker()
  onProgressActual = onProgress || null
  const { data } = await worker.recognize(canvas)
  onProgressActual = null
  return data.text
}
