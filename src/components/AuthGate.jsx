import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabaseConfigurado } from '../lib/supabaseClient'

export default function AuthGate({ children }) {
  const { session, loading, recovery, signIn, signUp, sendPasswordReset, updatePassword } = useAuth()
  const { t, lang, toggleLang } = useLanguage()
  const [modo, setModo] = useState('entrar') // entrar | crear | olvide
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  const langToggle = (
    <button
      type="button"
      className="btn"
      style={{ position: 'fixed', top: 14, right: 14 }}
      onClick={toggleLang}
    >
      {lang === 'es' ? '🇲🇽 ES' : '🇬🇧 EN'}
    </button>
  )

  if (!supabaseConfigurado) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px' }}>
        {langToggle}
        <div className="card">
          <p className="card-title">{t('auth.missingTitle')}</p>
          <p className="card-sub">
            {t('auth.missingIntro1')} <code>.env</code> {t('auth.missingIntro2')} <code>.env.example</code>{t('auth.missingIntro3')}
          </p>
          <pre style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: '0.8rem', overflowX: 'auto' }}>
{`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key`}
          </pre>
          <p className="card-sub" style={{ marginBottom: 0 }}>
            {t('auth.missingOutro1')} <code>supabase/schema.sql</code> {t('auth.missingOutro2')} <code>npm run dev</code>{' '}
            {t('auth.missingOutro3')} <code>.env</code>{t('auth.missingOutro4')} <code>supabase/README.md</code>.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="empty" style={{ paddingTop: 60 }}>{t('auth.loading')}</div>
  }

  // Flujo de recuperación: llegó desde el enlace del correo (evento PASSWORD_RECOVERY).
  // Se muestra esta pantalla incluso si ya hay sesión, hasta que se guarde la nueva contraseña.
  if (recovery) {
    async function guardarNuevaPassword(e) {
      e.preventDefault()
      setError('')
      setAviso('')
      setEnviando(true)
      const { error } = await updatePassword(nuevaPassword)
      setEnviando(false)
      if (error) {
        setError(error.message)
        return
      }
      setAviso(t('auth.newPasswordSaved'))
      setNuevaPassword('')
    }

    return (
      <div style={{ maxWidth: 380, margin: '60px auto', padding: '0 16px' }}>
        {langToggle}
        <div className="card">
          <p className="card-title">{t('auth.newPasswordTitle')}</p>
          <p className="card-sub">{t('auth.newPasswordSubtitle')}</p>
          <form onSubmit={guardarNuevaPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label>{t('auth.newPasswordLabel')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
            {aviso && <p style={{ color: 'var(--online)', fontSize: '0.8rem', margin: 0 }}>{aviso}</p>}
            <button type="submit" className="btn primary" disabled={enviando}>
              {enviando ? t('auth.sending') : t('auth.newPasswordSave')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (session) return children

  async function submit(e) {
    e.preventDefault()
    setError('')
    setAviso('')
    setEnviando(true)

    if (modo === 'olvide') {
      const { error } = await sendPasswordReset(email)
      setEnviando(false)
      if (error) {
        setError(error.message)
        return
      }
      setAviso(t('auth.resetSent'))
      return
    }

    const { error } =
      modo === 'entrar' ? await signIn(email, password) : await signUp(email, password)
    setEnviando(false)
    if (error) {
      setError(error.message)
      return
    }
    if (modo === 'crear') {
      setAviso(t('auth.accountCreated'))
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '60px auto', padding: '0 16px' }}>
      {langToggle}
      <div className="card">
        <p className="card-title">
          {modo === 'entrar' ? t('auth.signIn') : modo === 'crear' ? t('auth.signUp') : t('auth.resetTitle')}
        </p>
        <p className="card-sub">{modo === 'olvide' ? t('auth.resetSubtitle') : t('auth.subtitle')}</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label>{t('auth.email')}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          {modo !== 'olvide' && (
            <div>
              <label>{t('auth.password')}</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
          {aviso && <p style={{ color: 'var(--online)', fontSize: '0.8rem', margin: 0 }}>{aviso}</p>}
          <button type="submit" className="btn primary" disabled={enviando}>
            {enviando
              ? t('auth.sending')
              : modo === 'entrar'
              ? t('auth.signIn')
              : modo === 'crear'
              ? t('auth.signUp')
              : t('auth.resetSend')}
          </button>
        </form>

        {modo === 'entrar' && (
          <button
            type="button"
            className="btn"
            style={{ marginTop: 8, width: '100%', background: 'transparent', boxShadow: 'none', border: 'none', color: 'var(--text-muted)' }}
            onClick={() => { setModo('olvide'); setError(''); setAviso('') }}
          >
            {t('auth.forgotPassword')}
          </button>
        )}

        <button
          type="button"
          className="btn"
          style={{ marginTop: 10, width: '100%' }}
          onClick={() => {
            setModo(modo === 'entrar' ? 'crear' : 'entrar')
            setError('')
            setAviso('')
          }}
        >
          {modo === 'entrar' ? t('auth.noAccount') : t('auth.haveAccount')}
        </button>

        {modo === 'olvide' && (
          <button
            type="button"
            className="btn"
            style={{ marginTop: 8, width: '100%', background: 'transparent', boxShadow: 'none', border: 'none', color: 'var(--text-muted)' }}
            onClick={() => { setModo('entrar'); setError(''); setAviso('') }}
          >
            {t('auth.backToSignIn')}
          </button>
        )}
      </div>
    </div>
  )
}
