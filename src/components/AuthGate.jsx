import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigurado } from '../lib/supabaseClient'

export default function AuthGate({ children }) {
  const { session, loading, signIn, signUp } = useAuth()
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!supabaseConfigurado) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px' }}>
        <div className="card">
          <p className="card-title">Falta configurar Supabase</p>
          <p className="card-sub">
            La app no puede conectarse porque no encontró tus credenciales de Supabase. Crea un archivo{' '}
            <code>.env</code> en la raíz del proyecto (puedes copiar <code>.env.example</code>) con:
          </p>
          <pre style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: '0.8rem', overflowX: 'auto' }}>
{`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key`}
          </pre>
          <p className="card-sub" style={{ marginBottom: 0 }}>
            Toma esos valores de tu proyecto en supabase.com (Project Settings → API), corre{' '}
            <code>supabase/schema.sql</code> en el SQL Editor de ese proyecto, y reinicia <code>npm run dev</code>{' '}
            (o vuelve a desplegar) después de guardar el <code>.env</code>. Más detalle en{' '}
            <code>supabase/README.md</code>.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="empty" style={{ paddingTop: 60 }}>Cargando…</div>
  }

  if (session) return children

  async function submit(e) {
    e.preventDefault()
    setError('')
    setAviso('')
    setEnviando(true)
    const { error } =
      modo === 'entrar' ? await signIn(email, password) : await signUp(email, password)
    setEnviando(false)
    if (error) {
      setError(error.message)
      return
    }
    if (modo === 'crear') {
      setAviso('Cuenta creada. Revisa tu correo si se requiere confirmación, o entra directamente si no.')
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '60px auto', padding: '0 16px' }}>
      <div className="card">
        <p className="card-title">{modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</p>
        <p className="card-sub">Tus datos se sincronizan en la nube entre todos tus dispositivos.</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label>Correo</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
          {aviso && <p style={{ color: 'var(--online)', fontSize: '0.8rem', margin: 0 }}>{aviso}</p>}
          <button type="submit" className="btn primary" disabled={enviando}>
            {enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
        <button
          type="button"
          className="btn"
          style={{ marginTop: 10, width: '100%' }}
          onClick={() => { setModo(modo === 'entrar' ? 'crear' : 'entrar'); setError(''); setAviso('') }}
        >
          {modo === 'entrar' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Entrar'}
        </button>
      </div>
    </div>
  )
}
