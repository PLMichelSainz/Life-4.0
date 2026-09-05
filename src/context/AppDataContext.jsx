import { createContext, useContext } from 'react'
import { useCloudState } from '../hooks/useCloudState'
import { useAuth } from './AuthContext'
import { TARIFA_ORDINARIA } from '../utils/overtime'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.id

  // horasPorSemana: { [weekStartISO]: [h0..h6] } (lunes..domingo)
  const [horasPorSemana, setHorasPorSemana] = useCloudState(uid, 'overtime.weeks', {})

  // transporte: { [dateISO]: { normal: number, transbordo: number } } (solo días editados a mano)
  const [transporte, setTransporte] = useCloudState(uid, 'transport.days', {})

  // cuántos camiones/transbordos se asumen por día si el usuario no lo cambia ese día
  const [transporteDefault, setTransporteDefault] = useCloudState(uid, 'transport.defaults', {
    normal: 2,
    transbordo: 2,
  })

  // wishlist: [{ id, nombre, precio, comentario, completado, aportes: [{id, monto, fecha}] }]
  const [wishlist, setWishlist] = useCloudState(uid, 'wishlist.items', [])

  // deudas: [{ id, nombre, montoTotal, pagos: [{ id, monto, fecha }] }]
  const [deudas, setDeudas] = useCloudState(uid, 'debts.items', [])

  // saldo libre de la tarjeta de transporte (se actualiza manualmente)
  const [tarjetaSaldo, setTarjetaSaldo] = useCloudState(uid, 'transport.cardBalance', 0)

  // tarifa por hora usada en la pestaña de Salarios (editable, por si cambia)
  const [tarifaPorHora, setTarifaPorHora] = useCloudState(uid, 'salaries.hourlyRate', TARIFA_ORDINARIA)

  // otras deducciones personalizadas (Infonavit, Fonacot, pensión alimenticia, sindicato, etc.)
  // [{ id, nombre, tipo: 'porcentaje' | 'monto', valor }]
  const [otrasDeducciones, setOtrasDeducciones] = useCloudState(uid, 'salaries.otherDeductions', [])

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
      { id: crypto.randomUUID(), nombre, precio: Number(precio) || 0, comentario, completado: false, aportes: [] },
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

  function addAporteWishlist(itemId, monto, fecha) {
    setWishlist((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, aportes: [...(it.aportes || []), { id: crypto.randomUUID(), monto: Number(monto) || 0, fecha }] }
          : it
      )
    )
  }

  function removeAporteWishlist(itemId, aporteId) {
    setWishlist((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, aportes: (it.aportes || []).filter((a) => a.id !== aporteId) } : it
      )
    )
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

  function addDeduccion(nombre, tipo, valor) {
    setOtrasDeducciones((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nombre, tipo, valor: Number(valor) || 0 },
    ])
  }

  function removeDeduccion(id) {
    setOtrasDeducciones((prev) => prev.filter((d) => d.id !== id))
  }

  const value = {
    horasPorSemana,
    setHorasDia,
    transporte,
    setTransporteDia,
    transporteDefault,
    setTransporteDefault,
    wishlist,
    addWishlistItem,
    updateWishlistItem,
    removeWishlistItem,
    toggleWishlistItem,
    addAporteWishlist,
    removeAporteWishlist,
    deudas,
    addDeuda,
    updateDeuda,
    removeDeuda,
    addPagoDeuda,
    removePagoDeuda,
    tarjetaSaldo,
    setTarjetaSaldo,
    tarifaPorHora,
    setTarifaPorHora,
    otrasDeducciones,
    addDeduccion,
    removeDeduccion,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  return useContext(AppDataContext)
}
