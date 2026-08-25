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

  // deudas: [{ id, nombre, montoTotal, pagos: [{ id, monto, fecha }] }]
  const [deudas, setDeudas] = useLocalStorage('debts.items', [])

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

  function addWishlistItem(nombre, precio, comentario = '') {
    setWishlist((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nombre, precio: Number(precio) || 0, comentario, completado: false },
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

  function addDeuda(nombre, montoTotal) {
    setDeudas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nombre, montoTotal: Number(montoTotal) || 0, pagos: [] },
    ])
  }

  function updateDeuda(id, cambios) {
    setDeudas((prev) => prev.map((d) => (d.id === id ? { ...d, ...cambios } : d)))
  }

  function removeDeuda(id) {
    setDeudas((prev) => prev.filter((d) => d.id !== id))
  }

  function addPagoDeuda(deudaId, monto, fecha) {
    setDeudas((prev) =>
      prev.map((d) =>
        d.id === deudaId
          ? { ...d, pagos: [...d.pagos, { id: crypto.randomUUID(), monto: Number(monto) || 0, fecha }] }
          : d
      )
    )
  }

  function removePagoDeuda(deudaId, pagoId) {
    setDeudas((prev) =>
      prev.map((d) => (d.id === deudaId ? { ...d, pagos: d.pagos.filter((p) => p.id !== pagoId) } : d))
    )
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
    deudas,
    addDeuda,
    updateDeuda,
    removeDeuda,
    addPagoDeuda,
    removePagoDeuda,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  return useContext(AppDataContext)
}
