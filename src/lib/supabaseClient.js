import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigurado = Boolean(url && anonKey)

if (!supabaseConfigurado) {
  // eslint-disable-next-line no-console
  console.warn(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y llénalo (ver supabase/README.md).'
  )
}

// Si faltan las credenciales, createClient truena de inmediato (deja la
// página en blanco sin ningún error visible). Usamos valores dummy válidos
// en ese caso; supabaseConfigurado se usa en AuthGate para mostrar una
// pantalla de configuración en vez de intentar conectarse.
export const supabase = createClient(
  supabaseConfigurado ? url : 'https://placeholder.supabase.co',
  supabaseConfigurado ? anonKey : 'placeholder-anon-key'
)
