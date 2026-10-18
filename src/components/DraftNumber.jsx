import { useEffect, useRef, useState } from 'react'

const aTexto = (v) => (v === 0 || v === undefined || v === null || Number.isNaN(Number(v)) ? '' : String(v))
const aNumero = (txt) => {
  const n = Number(txt)
  return Number.isFinite(n) ? n : 0
}

/**
 * Campo numérico fluido: lo que escribes se muestra al instante (estado local) y el
 * valor se envía a la app cuando dejas de teclear (`delay` ms), al salir del campo o al
 * cerrar la pantalla. Así escribir nunca depende del guardado ni de la sincronización.
 */
export default function DraftNumber({ value, onCommit, delay = 350, ...props }) {
  const [texto, setTexto] = useState(aTexto(value))
  const textoRef = useRef(texto)
  const editando = useRef(false)
  const pendiente = useRef(false)
  const timer = useRef(null)
  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

  // Si el valor cambia desde fuera (otro dispositivo, horario leído...) y no estás escribiendo, se refleja.
  useEffect(() => {
    if (editando.current || pendiente.current) return
    setTexto((prev) => {
      const siguiente = aNumero(prev) === aNumero(value) ? prev : aTexto(value)
      textoRef.current = siguiente
      return siguiente
    })
  }, [value])

  function enviar() {
    clearTimeout(timer.current)
    timer.current = null
    if (!pendiente.current) return
    pendiente.current = false
    onCommitRef.current(aNumero(textoRef.current))
  }

  // Si te vas de la pantalla con algo sin enviar, se envía.
  useEffect(() => () => enviar(), []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      type="number"
      {...props}
      value={texto}
      onFocus={() => {
        editando.current = true
      }}
      onChange={(e) => {
        textoRef.current = e.target.value
        setTexto(e.target.value)
        editando.current = true
        pendiente.current = true
        clearTimeout(timer.current)
        timer.current = setTimeout(enviar, delay)
      }}
      onBlur={() => {
        editando.current = false
        enviar()
      }}
    />
  )
}
