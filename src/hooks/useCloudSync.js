import { useCallback, useEffect, useRef, useState } from 'react'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const SYNC_ROW_ID = 'default'
const PENDING_KEY = 'app.sync.pending'
const CLIENT_KEY = 'app.sync.clientId'

function getClientId() {
  try {
    const existing = window.localStorage.getItem(CLIENT_KEY)
    if (existing) return existing
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem(CLIENT_KEY, id)
    return id
  } catch {
    return 'local-client'
  }
}

function readPending() {
  try {
    return window.localStorage.getItem(PENDING_KEY) === '1'
  } catch {
    return false
  }
}

function writePending(value) {
  try {
    if (value) window.localStorage.setItem(PENDING_KEY, '1')
    else window.localStorage.removeItem(PENDING_KEY)
  } catch {
    // localStorage puede estar temporalmente no disponible.
  }
}

function mergeById(localItems, remoteItems, deletedIds = []) {
  const map = new Map()
  const deleted = new Set(deletedIds)

  for (const item of [...(remoteItems || []), ...(localItems || [])]) {
    if (deleted.has(item.id)) continue

    const previous = map.get(item.id)
    if (!previous) {
      map.set(item.id, item)
      continue
    }

    const previousTime = Number(previous.updatedAt) || 0
    const itemTime = Number(item.updatedAt) || 0
    map.set(item.id, itemTime >= previousTime ? { ...previous, ...item } : { ...item, ...previous })
  }

  return [...map.values()]
}

function mergeTimestampedMap(localMap, remoteMap, localMeta, remoteMeta) {
  const result = {}
  const keys = new Set([...Object.keys(remoteMap || {}), ...Object.keys(localMap || {})])

  for (const key of keys) {
    const localTime = Number(localMeta?.[key]) || 0
    const remoteTime = Number(remoteMeta?.[key]) || 0
    result[key] = localTime >= remoteTime ? localMap?.[key] : remoteMap?.[key]

    if (result[key] === undefined) {
      result[key] = remoteMap?.[key] ?? localMap?.[key]
    }
  }

  return result
}

function mergeSnapshots(local, remote) {
  if (!remote) return local

  const wishlistDeletedIds = Array.from(new Set([
    ...(remote.wishlistDeletedIds || []),
    ...(local.wishlistDeletedIds || []),
  ]))
  const deudasDeletedIds = Array.from(new Set([
    ...(remote.deudasDeletedIds || []),
    ...(local.deudasDeletedIds || []),
  ]))

  const localSaldoTime = Number(local.tarjetaSaldoUpdatedAt) || 0
  const remoteSaldoTime = Number(remote.tarjetaSaldoUpdatedAt) || 0

  return {
    horasPorSemana: mergeTimestampedMap(
      local.horasPorSemana,
      remote.horasPorSemana,
      local.horasUpdatedAt,
      remote.horasUpdatedAt
    ),
    horasUpdatedAt: { ...(remote.horasUpdatedAt || {}), ...(local.horasUpdatedAt || {}) },
    transporte: mergeTimestampedMap(
      local.transporte,
      remote.transporte,
      local.transporteUpdatedAt,
      remote.transporteUpdatedAt
    ),
    transporteUpdatedAt: { ...(remote.transporteUpdatedAt || {}), ...(local.transporteUpdatedAt || {}) },
    wishlist: mergeById(local.wishlist, remote.wishlist, wishlistDeletedIds),
    wishlistDeletedIds,
    deudas: mergeById(local.deudas, remote.deudas, deudasDeletedIds),
    deudasDeletedIds,
    tarjetaSaldo: localSaldoTime >= remoteSaldoTime
      ? local.tarjetaSaldo
      : remote.tarjetaSaldo,
    tarjetaSaldoUpdatedAt: Math.max(localSaldoTime, remoteSaldoTime),
  }
}

async function request(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Cloud sync no configurado')
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Cloud sync HTTP ${response.status}`)
  }

  return response
}

export function useCloudSync(data, applyData) {
  const [online, setOnline] = useState(false)
  const initialized = useRef(false)
  const applyingRemote = useRef(false)
  const timer = useRef(null)
  const clientId = useRef(null)

  if (!clientId.current && typeof window !== 'undefined') {
    clientId.current = getClientId()
  }

  const syncNow = useCallback(async (snapshot = data) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setOnline(false)
      return false
    }

    try {
      const response = await request(`app_sync?id=eq.${encodeURIComponent(SYNC_ROW_ID)}`, {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          id: SYNC_ROW_ID,
          data: snapshot,
          client_id: clientId.current,
          updated_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        writePending(false)
        setOnline(true)
        return true
      }
    } catch {
      // Se conserva el snapshot local y se reintentará después.
    }

    writePending(true)
    setOnline(false)
    return false
  }, [data])

  const checkAndSync = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setOnline(false)
      return
    }

    try {
      const response = await request(
        `app_sync?select=id,data,updated_at&id=eq.${encodeURIComponent(SYNC_ROW_ID)}`
      )
      const rows = await response.json()
      const remote = rows?.[0]?.data

      if (remote && !readPending()) {
        const merged = mergeSnapshots(data, remote)
        const changed = JSON.stringify(merged) !== JSON.stringify(data)

        if (changed) {
          applyingRemote.current = true
          applyData(merged)
          await syncNow(merged)
        } else {
          setOnline(true)
        }
      } else {
        await syncNow(remote ? mergeSnapshots(data, remote) : data)
      }

      setOnline(true)
    } catch {
      writePending(true)
      setOnline(false)
    } finally {
      initialized.current = true
    }
  }, [applyData, data, syncNow])

  useEffect(() => {
    checkAndSync()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // Solo se ejecuta al montar el proveedor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initialized.current) return

    if (applyingRemote.current) {
      applyingRemote.current = false
      return
    }

    writePending(true)

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      syncNow(data)
    }, 600)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [data, syncNow])

  useEffect(() => {
    const retry = () => checkAndSync()
    window.addEventListener('online', retry)
    const interval = window.setInterval(retry, 30000)

    return () => {
      window.removeEventListener('online', retry)
      window.clearInterval(interval)
    }
  }, [checkAndSync])

  return {
    online,
    configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    retry: checkAndSync,
  }
}
