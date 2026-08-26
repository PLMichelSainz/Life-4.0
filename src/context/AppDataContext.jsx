import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useCloudSync } from '../hooks/useCloudSync'

const AppDataContext = createContext(null)

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function migrateWishlist(items) {
  return (items || []).map((item) => {
    const abonos = Array.isArray(item.abonos) ? item.abonos : []
    const ahorrado = abonos.reduce((sum, abono) => sum + (Number(abono.monto) || 0), 0)
    return {
      ...item,
      comentario: item.comentario || '',
      abonos,
      ahorrado: Number(item.ahorrado) || ahorrado,
      updatedAt: Number(item.updatedAt) || 0,
    }
  })
}

function migrateDebts(items) {
  return (items || []).map((deuda) => ({
    ...deuda,
    comentario: deuda.comentario || '',
    pagos: Array.isArray(deuda.pagos) ? deuda.pagos : [],
    updatedAt: Number(deuda.updatedAt) || 0,
  }))
}

export function AppDataProvider({ children }) {
  // Se conservan las claves existentes para no romper los datos actuales.
  const [horasPorSemana, setHorasPorSemana] = useLocalStorage('overtime.weeks', {})
  const [horasUpdatedAt, setHorasUpdatedAt] = useLocalStorage('overtime.updatedAt', {})
  const [transporte, setTransporte] = useLocalStorage('transport.days', {})
  const [transporteUpdatedAt, setTransporteUpdatedAt] = useLocalStorage('transport.updatedAt', {})
  const [wishlist, setWishlist] = useLocalStorage('wishlist.items', [])
  const [wishlistDeletedIds, setWishlistDeletedIds] = useLocalStorage('wishlist.deleted', [])
  const [deudas, setDeudas] = useLocalStorage('debts.items', [])
  const [deudasDeletedIds, setDeudasDeletedIds] = useLocalStorage('debts.deleted', [])
  const [tarjetaSaldo, setTarjetaSaldoRaw] = useLocalStorage('transport.cardBalance', 0)
  const [tarjetaSaldoUpdatedAt, setTarjetaSaldoUpdatedAt] = useLocalStorage('transport.cardBalance.updatedAt', 0)

  const wishlistMigrada = useMemo(() => migrateWishlist(wishlist), [wishlist])
  const deudasMigradas = useMemo(() => migrateDebts(deudas), [deudas])

  function aplicarDatosRemotos(data) {
    if (!data) return
    if (data.horasPorSemana) setHorasPorSemana(data.horasPorSemana)
    if (data.horasUpdatedAt) setHorasUpdatedAt(data.horasUpdatedAt)
    if (data.transporte) setTransporte(data.transporte)
    if (data.transporteUpdatedAt) setTransporteUpdatedAt(data.transporteUpdatedAt)
    if (data.wishlist) setWishlist(migrateWishlist(data.wishlist))
    if (data.wishlistDeletedIds) setWishlistDeletedIds(data.wishlistDeletedIds)
    if (data.deudas) setDeudas(migrateDebts(data.deudas))
    if (data.deudasDeletedIds) setDeudasDeletedIds(data.deudasDeletedIds)
    if (data.tarjetaSaldo !== undefined) setTarjetaSaldoRaw(data.tarjetaSaldo)
    if (data.tarjetaSaldoUpdatedAt !== undefined) setTarjetaSaldoUpdatedAt(data.tarjetaSaldoUpdatedAt)
  }

  const syncData = useMemo(() => ({
    horasPorSemana,
    horasUpdatedAt,
    transporte,
    transporteUpdatedAt,
    wishlist: wishlistMigrada,
    wishlistDeletedIds,
    deudas: deudasMigradas,
    deudasDeletedIds,
    tarjetaSaldo,
    tarjetaSaldoUpdatedAt,
  }), [
    horasPorSemana,
    horasUpdatedAt,
    transporte,
    transporteUpdatedAt,
    wishlistMigrada,
    wishlistDeletedIds,
    deudasMigradas,
    deudasDeletedIds,
    tarjetaSaldo,
    tarjetaSaldoUpdatedAt,
  ])

  const { online: cloudOnline, configured: cloudConfigured, retry: retrySync } = useCloudSync(syncData, aplicarDatosRemotos)

  function setHorasDia(weekStartISO, dayIndex, horas) {
    const now = Date.now()
    setHorasPorSemana((prev) => {
      const semanaActual = prev[weekStartISO] || [0, 0, 0, 0, 0, 0, 0]
      const nueva = [...semanaActual]
      nueva[dayIndex] = horas
      return { ...prev, [weekStartISO]: nueva }
    })
    setHorasUpdatedAt((prev) => ({ ...prev, [weekStartISO]: now }))
  }

  function setTransporteDia(dateISO, campo, valor) {
    const now = Date.now()
    setTransporte((prev) => ({
      ...prev,
      [dateISO]: { normal: 0, transbordo: 0, ...(prev[dateISO] || {}), [campo]: valor },
    }))
    setTransporteUpdatedAt((prev) => ({ ...prev, [dateISO]: now }))
  }

  function addWishlistItem(nombre, precio, comentario = '') {
    setWishlist((prev) => [
      ...prev,
      {
        id: createId(),
        nombre,
        precio: Number(precio) || 0,
        comentario,
        completado: false,
        ahorrado: 0,
        abonos: [],
        updatedAt: Date.now(),
      },
    ])
  }

  function updateWishlistItem(id, cambios) {
    setWishlist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...cambios, updatedAt: Date.now() } : it))
    )
  }

  function removeWishlistItem(id) {
    setWishlist((prev) => prev.filter((it) => it.id !== id))
    setWishlistDeletedIds((prev) => Array.from(new Set([...prev, id])))
  }

  function toggleWishlistItem(id) {
    setWishlist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, completado: !it.completado, updatedAt: Date.now() } : it))
    )
  }

  function addAbonoWishlist(itemId, monto, fecha) {
    const amount = Number(monto) || 0
    if (amount <= 0) return

    setWishlist((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it
        const abono = { id: createId(), monto: amount, fecha }
        const abonos = [...(it.abonos || []), abono]
        const ahorrado = abonos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
        return { ...it, abonos, ahorrado, updatedAt: Date.now() }
      })
    )
  }

  function removeAbonoWishlist(itemId, abonoId) {
    setWishlist((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it
        const abonos = (it.abonos || []).filter((p) => p.id !== abonoId)
        const ahorrado = abonos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
        return { ...it, abonos, ahorrado, updatedAt: Date.now() }
      })
    )
  }

  function addDeuda(nombre, montoTotal, comentario = '') {
    setDeudas((prev) => [
      ...prev,
      {
        id: createId(),
        nombre,
        montoTotal: Number(montoTotal) || 0,
        comentario,
        pagos: [],
        updatedAt: Date.now(),
      },
    ])
  }

  function updateDeuda(id, cambios) {
    setDeudas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...cambios, updatedAt: Date.now() } : d))
    )
  }

  function removeDeuda(id) {
    setDeudas((prev) => prev.filter((d) => d.id !== id))
    setDeudasDeletedIds((prev) => Array.from(new Set([...prev, id])))
  }

  function addPagoDeuda(deudaId, monto, fecha) {
    setDeudas((prev) =>
      prev.map((d) =>
        d.id === deudaId
          ? {
              ...d,
              pagos: [...(d.pagos || []), { id: createId(), monto: Number(monto) || 0, fecha }],
              updatedAt: Date.now(),
            }
          : d
      )
    )
  }

  function removePagoDeuda(deudaId, pagoId) {
    setDeudas((prev) =>
      prev.map((d) =>
        d.id === deudaId
          ? { ...d, pagos: d.pagos.filter((p) => p.id !== pagoId), updatedAt: Date.now() }
          : d
      )
    )
  }

  function setTarjetaSaldo(valor) {
    setTarjetaSaldoRaw(valor)
    setTarjetaSaldoUpdatedAt(Date.now())
  }

  const value = {
    horasPorSemana,
    setHorasDia,
    transporte,
    setTransporteDia,
    wishlist: wishlistMigrada,
    addWishlistItem,
    updateWishlistItem,
    removeWishlistItem,
    toggleWishlistItem,
    addAbonoWishlist,
    removeAbonoWishlist,
    deudas: deudasMigradas,
    addDeuda,
    updateDeuda,
    removeDeuda,
    addPagoDeuda,
    removePagoDeuda,
    tarjetaSaldo,
    setTarjetaSaldo,
    cloudOnline,
    cloudConfigured,
    retrySync,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  return useContext(AppDataContext)
}
