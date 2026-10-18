import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Espera sin cambios antes de guardar: así escribir "250" es UN guardado y no tres.
const RETARDO_GUARDADO_MS = 700
const REINTENTO_MS = 5000

/**
 * Estado persistido en Supabase (tabla app_state), sincronizado en vivo
 * entre dispositivos vía Realtime. Cae en `initialValue` mientras carga
 * o si no hay usuario. `key` debe ser único por tipo de dato (ej. 'wishlist.items').
 *
 * Estabilidad al capturar datos:
 *  - Los guardados se agrupan (debounce) y se envían de uno en uno, en orden.
 *  - Se recuerda el JSON que ya está en la nube, así no se reenvía lo que no cambió
 *    y los avisos en vivo que son "eco" de tu propio guardado se ignoran.
 *  - Un aviso remoto nunca pisa cambios locales que aún no se han guardado
 *    (antes, el eco revertía el campo mientras seguías escribiendo).
 */
export function useCloudState(userId, key, initialValue) {
  const [value, setValue] = useState(initialValue)
  const [ready, setReady] = useState(false)

  const valueRef = useRef(initialValue)
  valueRef.current = value
  const sincronizadoRef = useRef(null) // JSON de lo último que sabemos que está en la nube
  const temporizadorRef = useRef(null)
  const enviandoRef = useRef(false)
  const reenviarRef = useRef(false)
  const enviarRef = useRef(null)

  async function enviar() {
    temporizadorRef.current = null
    if (!userId) return
    const json = JSON.stringify(valueRef.current)
    if (json === sincronizadoRef.current) return
    if (enviandoRef.current) {
      reenviarRef.current = true // se reenvía lo más reciente al terminar el envío actual
      return
    }
    enviandoRef.current = true
    const { error } = await supabase
      .from('app_state')
      .upsert(
        { user_id: userId, key, value: valueRef.current, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      )
    enviandoRef.current = false
    if (error) {
      console.error('Error guardando en la nube:', error.message)
      // sin conexión o fallo temporal: se reintenta solo
      temporizadorRef.current = setTimeout(() => enviarRef.current(), REINTENTO_MS)
    } else {
      sincronizadoRef.current = json
    }
    if (reenviarRef.current) {
      reenviarRef.current = false
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
      enviarRef.current()
    }
  }
  enviarRef.current = enviar

  useEffect(() => {
    setReady(false)
    setValue(initialValue)
    sincronizadoRef.current = null
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
    temporizadorRef.current = null
    if (!userId) return undefined

    let activo = true
    let channel

    async function cargar() {
      const { data } = await supabase
        .from('app_state')
        .select('value')
        .eq('user_id', userId)
        .eq('key', key)
        .maybeSingle()

      if (!activo) return
      if (data) {
        sincronizadoRef.current = JSON.stringify(data.value)
        setValue(data.value)
      }
      setReady(true)

      channel = supabase
        .channel(`app_state:${userId}:${key}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_state', filter: `user_id=eq.${userId}` },
          (payload) => {
            const fila = payload.new
            if (!fila || fila.key !== key) return
            const remoto = JSON.stringify(fila.value)
            if (remoto === sincronizadoRef.current) return // eco de lo que ya sabíamos
            const local = JSON.stringify(valueRef.current)
            if (remoto === local) {
              sincronizadoRef.current = remoto
              return
            }
            // Hay cambios locales sin guardar (o guardándose): no se pisan.
            if (enviandoRef.current || local !== sincronizadoRef.current) return
            sincronizadoRef.current = remoto
            setValue(fila.value)
          }
        )
        .subscribe()
    }
    cargar()

    // Si hay un guardado pendiente y te vas de la pantalla, se envía de inmediato.
    function vaciar() {
      if (temporizadorRef.current) {
        clearTimeout(temporizadorRef.current)
        enviarRef.current()
      }
    }
    function alOcultar() {
      if (document.visibilityState === 'hidden') vaciar()
    }
    window.addEventListener('pagehide', vaciar)
    document.addEventListener('visibilitychange', alOcultar)

    return () => {
      activo = false
      vaciar()
      window.removeEventListener('pagehide', vaciar)
      document.removeEventListener('visibilitychange', alOcultar)
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key])

  useEffect(() => {
    if (!userId || !ready) return
    if (JSON.stringify(value) === sincronizadoRef.current) return
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
    temporizadorRef.current = setTimeout(() => enviarRef.current(), RETARDO_GUARDADO_MS)
  }, [value, userId, ready])

  async function refetch() {
    if (!userId) return
    const { data, error } = await supabase
      .from('app_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle()
    if (!error && data) {
      const json = JSON.stringify(data.value)
      sincronizadoRef.current = json
      if (json !== JSON.stringify(valueRef.current)) setValue(data.value)
    }
    return { error }
  }

  return [value, setValue, refetch]
}
