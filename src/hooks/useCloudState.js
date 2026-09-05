import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Estado persistido en Supabase (tabla app_state), sincronizado en vivo
 * entre dispositivos vía Realtime. Cae en `initialValue` mientras carga
 * o si no hay usuario. `key` debe ser único por tipo de dato (ej. 'wishlist.items').
 */
export function useCloudState(userId, key, initialValue) {
  const [value, setValue] = useState(initialValue)
  const [ready, setReady] = useState(false)
  const skipNextPush = useRef(false)
  const valueRef = useRef(initialValue)
  valueRef.current = value

  useEffect(() => {
    setReady(false)
    setValue(initialValue)
    if (!userId) return

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
        skipNextPush.current = true
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
            if (fila && fila.key === key && JSON.stringify(fila.value) !== JSON.stringify(valueRef.current)) {
              skipNextPush.current = true
              setValue(fila.value)
            }
          }
        )
        .subscribe()
    }
    cargar()

    return () => {
      activo = false
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key])

  useEffect(() => {
    if (!userId || !ready) return
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    supabase
      .from('app_state')
      .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' })
      .then(({ error }) => {
        if (error) console.error('Error guardando en la nube:', error.message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, userId, key, ready])

  return [value, setValue]
}
