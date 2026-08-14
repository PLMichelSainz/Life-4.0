import { useState, useEffect, useRef } from 'react'

/**
 * Persiste un valor en localStorage (persistencia nativa de cliente,
 * óptima para un despliegue estático en Vercel sin backend).
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  const first = useRef(true)

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // almacenamiento lleno o no disponible: se ignora silenciosamente
    }
  }, [key, value])

  return [value, setValue]
}
