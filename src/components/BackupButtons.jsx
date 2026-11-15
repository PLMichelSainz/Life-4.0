import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useConfirm } from './ConfirmDialog'

const TEXTOS = {
  es: { exportar: 'Respaldo', importar: 'Restaurar', exportando: 'Exportando…',
    errExportar: 'No se pudo exportar el respaldo.', errArchivo: 'El archivo no es un respaldo válido.',
    errImportar: 'No se pudo restaurar. No se modificó nada más.',
    confirmar: (n) => `Se restaurarán ${n} secciones de datos con lo que dice el archivo (se sobrescriben solo esas). Antes se descargará un respaldo de tus datos actuales. ¿Continuar?`,
    boton: 'Restaurar' },
  en: { exportar: 'Backup', importar: 'Restore', exportando: 'Exporting…',
    errExportar: 'Could not export the backup.', errArchivo: 'The file is not a valid backup.',
    errImportar: 'Could not restore. Nothing else was changed.',
    confirmar: (n) => `${n} data sections will be restored from the file (only those are overwritten). A backup of your current data will be downloaded first. Continue?`,
    boton: 'Restore' },
  fr: { exportar: 'Sauvegarde', importar: 'Restaurer', exportando: 'Export…',
    errExportar: "Impossible d'exporter la sauvegarde.", errArchivo: "Le fichier n'est pas une sauvegarde valide.",
    errImportar: "Restauration impossible. Rien d'autre n'a été modifié.",
    confirmar: (n) => `${n} sections de données seront restaurées depuis le fichier (seules celles-ci sont écrasées). Une sauvegarde de vos données actuelles sera téléchargée avant. Continuer ?`,
    boton: 'Restaurer' },
}

// Claves válidas: "modulo.nombre" (ej. wishlist.items). Evita escribir claves arbitrarias.
const CLAVE_VALIDA = /^[a-zA-Z]+\.[a-zA-Z]+$/

function descargar(filas) {
  const cuerpo = JSON.stringify({ app: 'quincena', version: 1, exportado: new Date().toISOString(), filas }, null, 2)
  const url = URL.createObjectURL(new Blob([cuerpo], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `quincena-respaldo-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function leerFilas(userId) {
  const { data, error } = await supabase.from('app_state').select('key,value').eq('user_id', userId)
  if (error) throw error
  return data
}

export default function BackupButtons() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const pedirConfirmacion = useConfirm()
  const x = TEXTOS[lang] || TEXTOS.es
  const inputRef = useRef(null)
  const [ocupado, setOcupado] = useState(false)

  async function exportar() {
    setOcupado(true)
    try {
      descargar(await leerFilas(user.id))
    } catch (e) {
      console.error(e)
      alert(x.errExportar)
    }
    setOcupado(false)
  }

  async function alElegirArchivo(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    let filas
    try {
      const json = JSON.parse(await archivo.text())
      filas = json?.app === 'quincena' && Array.isArray(json.filas) ? json.filas : null
      if (!filas || !filas.length || !filas.every((f) => f && CLAVE_VALIDA.test(f.key) && f.value !== undefined)) {
        throw new Error('formato')
      }
    } catch {
      alert(x.errArchivo)
      return
    }
    pedirConfirmacion(async () => {
      setOcupado(true)
      try {
        descargar(await leerFilas(user.id)) // respaldo previo de lo actual
        const ahora = new Date().toISOString()
        const { error } = await supabase.from('app_state').upsert(
          filas.map((f) => ({ user_id: user.id, key: f.key, value: f.value, updated_at: ahora })),
          { onConflict: 'user_id,key' }
        )
        if (error) throw error
        window.location.reload()
      } catch (err) {
        console.error(err)
        alert(x.errImportar)
        setOcupado(false)
      }
    }, { mensaje: x.confirmar(filas.length), boton: x.boton })
  }

  return (
    <>
      <button className="theme-toggle" onClick={exportar} disabled={ocupado} title={x.exportar}>
        {ocupado ? x.exportando : x.exportar}
      </button>
      <button className="theme-toggle" onClick={() => inputRef.current?.click()} disabled={ocupado}>
        {x.importar}
      </button>
      <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={alElegirArchivo} />
    </>
  )
}
