import { createContext, useContext } from 'react'
import { useCloudState } from '../hooks/useCloudState'
import { useAuth } from './AuthContext'
import { TARIFA_ORDINARIA } from '../utils/overtime'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.id

  // horasPorSemana: { [weekStartISO]: [h0..h6] } (lunes..domingo)
  const [horasPorSemana, setHorasPorSemana, refetchHoras] = useCloudState(uid, 'overtime.weeks', {})

  // transporte: { [dateISO]: { normal: number, transbordo: number } } (solo días editados a mano)
  const [transporte, setTransporte, refetchTransporte] = useCloudState(uid, 'transport.days', {})

  // cuántos camiones/transbordos se asumen por día si el usuario no lo cambia ese día
  const [transporteDefault, setTransporteDefault, refetchTransporteDefault] = useCloudState(uid, 'transport.defaults', {
    normal: 2,
    transbordo: 2,
  })

  // wishlist: [{ id, nombre, precio, comentario, completado, aportes: [{id, monto, fecha}] }]
  const [wishlist, setWishlist, refetchWishlist] = useCloudState(uid, 'wishlist.items', [])

  // deudas: [{ id, nombre, montoTotal, pagos: [{ id, monto, fecha }] }]
  const [deudas, setDeudas, refetchDeudas] = useCloudState(uid, 'debts.items', [])

  // saldo libre de la tarjeta de transporte (se actualiza manualmente)
  const [tarjetaSaldo, setTarjetaSaldo, refetchTarjetaSaldo] = useCloudState(uid, 'transport.cardBalance', 0)

  // tarifa por hora usada en la pestaña de Salarios (editable, por si cambia)
  const [tarifaPorHora, setTarifaPorHora, refetchTarifa] = useCloudState(uid, 'salaries.hourlyRate', TARIFA_ORDINARIA)

  // otras deducciones personalizadas (Infonavit, Fonacot, pensión alimenticia, sindicato, etc.)
  // [{ id, nombre, tipo: 'porcentaje' | 'monto', valor }]
  const [otrasDeducciones, setOtrasDeducciones, refetchDeducciones] = useCloudState(uid, 'salaries.otherDeductions', [])

  // Presupuesto — dinero actual: [{ id, concepto, monto, tipo: 'credito'|'debito'|'cash' }]
  const [cuentas, setCuentas, refetchCuentas] = useCloudState(uid, 'budget.accounts', [])
  // Presupuesto — ingresos: [{ id, concepto, monto }]
  const [ingresos, setIngresos, refetchIngresos] = useCloudState(uid, 'budget.income', [])
  // Presupuesto — gastos fijos mensuales: [{ id, concepto, monto, categoria,
  // pagos: { [periodoYYYY-MM]: montoPagadoEsePeriodo } }]. `pagos` es nuevo;
  // los gastos ya existentes sin ese campo simplemente empiezan en 0 pagado.
  const [gastosFijos, setGastosFijos, refetchGastosFijos] = useCloudState(uid, 'budget.fixedExpenses', [])

  // Productos / Reposición — cosas que se consumen y eventualmente hay que
  // reponer, sin fecha fija: [{ id, nombre, categoria, precio, cantidad,
  // unidad, dondeComprar, frecuencia, notas, estado: 'tengo'|'necesito' }]
  const [productos, setProductos, refetchProductos] = useCloudState(uid, 'budget.products', [])

  // Pendientes generales (no necesariamente de dinero):
  // [{ id, titulo, prioridad: 'alta'|'media'|'baja', estado: 'pendiente'|'completado', categoria, fechaLimite, notas }]
  const [pendientes, setPendientes, refetchPendientes] = useCloudState(uid, 'budget.tasks', [])

  async function syncAll() {
    await Promise.all([
      refetchHoras(),
      refetchTransporte(),
      refetchTransporteDefault(),
      refetchWishlist(),
      refetchDeudas(),
      refetchTarjetaSaldo(),
      refetchTarifa(),
      refetchDeducciones(),
      refetchCuentas(),
      refetchIngresos(),
      refetchGastosFijos(),
      refetchProductos(),
      refetchPendientes(),
    ])
  }

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

  function addDeuda(nombre, montoTotal, comentario = '') {
    setDeudas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nombre, montoTotal: Number(montoTotal) || 0, comentario, pagos: [] },
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

  // ---- Presupuesto ----
  function addCuenta(concepto, monto, tipo = 'debito') {
    setCuentas((prev) => [...prev, { id: crypto.randomUUID(), concepto, monto: Number(monto) || 0, tipo }])
  }
  function updateCuenta(id, cambios) {
    setCuentas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)))
  }
  function removeCuenta(id) {
    setCuentas((prev) => prev.filter((c) => c.id !== id))
  }

  function addIngreso(concepto, monto) {
    setIngresos((prev) => [...prev, { id: crypto.randomUUID(), concepto, monto: Number(monto) || 0 }])
  }
  function updateIngreso(id, cambios) {
    setIngresos((prev) => prev.map((i) => (i.id === id ? { ...i, ...cambios } : i)))
  }
  function removeIngreso(id) {
    setIngresos((prev) => prev.filter((i) => i.id !== id))
  }

  function addGastoFijo(concepto, monto, categoria = '') {
    setGastosFijos((prev) => [...prev, { id: crypto.randomUUID(), concepto, monto: Number(monto) || 0, categoria, pagos: {} }])
  }
  function updateGastoFijo(id, cambios) {
    setGastosFijos((prev) => prev.map((g) => (g.id === id ? { ...g, ...cambios } : g)))
  }
  function removeGastoFijo(id) {
    setGastosFijos((prev) => prev.filter((g) => g.id !== id))
  }
  // Registra un pago (se acumula) del gasto fijo en el periodo mensual actual
  // (YYYY-MM). Al cambiar de mes, el periodo nuevo no existe en `pagos` todavía,
  // así que "pagado" vuelve a 0 automáticamente sin borrar el historial de meses anteriores.
  function pagarGastoFijo(id, monto, periodo) {
    const abono = Number(monto) || 0
    if (abono <= 0) return
    setGastosFijos((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, pagos: { ...(g.pagos || {}), [periodo]: ((g.pagos || {})[periodo] || 0) + abono } }
          : g
      )
    )
  }

  // ---- Productos / Reposición ----
  function addProducto(datos) {
    setProductos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nombre: datos.nombre,
        categoria: datos.categoria || '',
        precio: Number(datos.precio) || 0,
        cantidad: Number(datos.cantidad) || 1,
        unidad: datos.unidad || '',
        dondeComprar: datos.dondeComprar || '',
        frecuencia: datos.frecuencia || '',
        notas: datos.notas || '',
        estado: datos.estado || 'necesito',
      },
    ])
  }
  function updateProducto(id, cambios) {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
  }
  function removeProducto(id) {
    setProductos((prev) => prev.filter((p) => p.id !== id))
  }
  function toggleProductoEstado(id) {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: p.estado === 'tengo' ? 'necesito' : 'tengo' } : p))
    )
  }

  // ---- Pendientes ----
  function addPendiente(datos) {
    setPendientes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        titulo: datos.titulo,
        prioridad: datos.prioridad || 'media',
        estado: 'pendiente',
        categoria: datos.categoria || '',
        fechaLimite: datos.fechaLimite || '',
        notas: datos.notas || '',
      },
    ])
  }
  function updatePendiente(id, cambios) {
    setPendientes((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
  }
  function removePendiente(id) {
    setPendientes((prev) => prev.filter((p) => p.id !== id))
  }
  function togglePendienteEstado(id) {
    setPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: p.estado === 'completado' ? 'pendiente' : 'completado' } : p))
    )
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
    cuentas,
    addCuenta,
    updateCuenta,
    removeCuenta,
    ingresos,
    addIngreso,
    updateIngreso,
    removeIngreso,
    gastosFijos,
    addGastoFijo,
    updateGastoFijo,
    removeGastoFijo,
    pagarGastoFijo,
    productos,
    addProducto,
    updateProducto,
    removeProducto,
    toggleProductoEstado,
    pendientes,
    addPendiente,
    updatePendiente,
    removePendiente,
    togglePendienteEstado,
    syncAll,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  return useContext(AppDataContext)
}
