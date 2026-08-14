import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  // horasPorSemana: { [weekStartISO]: [h0..h6] } (lunes..domingo)
  const [horasPorSemana, setHorasPorSemana] = useLocalStorage('overtime.weeks', {})

  // transporte: { [dateISO]: { normal: number, transbordo: number } }
  const [transporte, setTransporte] = useLocalStorage('transport.days', {})

  // wishlist: [{ id, nombre, precio, completado }]
  const [wishlist, setWishlist] = useLocalStorage('wishlist.items', [])

  function setHorasDia(weekStartISO, dayIndex, horas) {
    setHorasPorSemana((prev) => {
      const semanaActual = prev[weekStartISO] || [0, 0, 0, 0, 0, 0, 0]
      const nueva = [...semanaActual]
      nueva[dayIndex] = horas
      return { ...prev, [weekStartISO]: nueva }
    })
  }

  function setTransporteDia(dateISO, campo, valor) {
    setTransporte((prev) => ({
      ...prev,
      [dateISO]: { normal: 0, transbordo: 0, ...(prev[dateISO] || {}), [campo]: valor },
    }))
  }

  function addWishlistItem(nombre, precio) {
    setWishlist((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nombre, precio: Number(precio) || 0, completado: false },
    ])
  }

  function updateWishlistItem(id, cambios) {
    setWishlist((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambios } : it)))
  }

  function removeWishlistItem(id) {
    setWishlist((prev) => prev.filter((it) => it.id !== id))
  }

  function toggleWishlistItem(id) {
    setWishlist((prev) => prev.map((it) => (it.id === id ? { ...it, completado: !it.completado } : it)))
  }

  const value = {
    horasPorSemana,
    setHorasDia,
    transporte,
    setTransporteDia,
    wishlist,
    addWishlistItem,
    updateWishlistItem,
    removeWishlistItem,
    toggleWishlistItem,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  return useContext(AppDataContext)
}
