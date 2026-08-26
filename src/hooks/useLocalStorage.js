import { useState, useEffect } from 'react'

/**
 * Persiste un valor en localStorage y conserva el estado en memoria
 * si el almacenamiento del navegador no está disponible.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue
      const raw = window.localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Si localStorage falla, el estado React sigue funcionando en memoria.
    }
  }, [key, value])

  return [value, setValue]
}
