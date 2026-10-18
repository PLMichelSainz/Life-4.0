import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

// Diálogo de confirmación único para toda la app.
// Uso:  const pedirConfirmacion = useConfirm()
//       pedirConfirmacion(() => eliminar(id))                       // "¿Seguro que quieres eliminarlo?"
//       pedirConfirmacion(fn, { mensaje: '...', boton: 'Reset' })   // mensaje/botón personalizados
const ConfirmContext = createContext(() => {})

export function ConfirmProvider({ children }) {
  const { t } = useLanguage()
  const [estado, setEstado] = useState(null) // { fn, mensaje, boton }
  const cancelarRef = useRef(null)

  const pedir = useCallback((fn, opciones = {}) => {
    setEstado({ fn, mensaje: opciones.mensaje, boton: opciones.boton })
  }, [])

  const cerrar = () => setEstado(null)
  const aceptar = () => {
    const fn = estado?.fn
    setEstado(null)
    if (fn) fn()
  }

  useEffect(() => {
    if (!estado) return undefined
    cancelarRef.current?.focus() // por seguridad, el foco empieza en "Cancelar"
    const alTeclear = (e) => {
      if (e.key === 'Escape') setEstado(null)
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [estado])

  return (
    <ConfirmContext.Provider value={pedir}>
      {children}
      {estado && (
        <div className="confirm-backdrop" onClick={cerrar}>
          <div
            className="card confirm-box"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="card-title" style={{ fontSize: '1rem', marginBottom: 0 }}>
              {estado.mensaje || t('common.confirmDelete')}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button ref={cancelarRef} className="btn" onClick={cerrar}>{t('common.cancel')}</button>
              <button className="btn danger" onClick={aceptar}>{estado.boton || t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
