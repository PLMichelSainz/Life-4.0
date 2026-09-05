import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabaseConfigurado) {
      setLoading(false)
      return
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return { error }
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setRecovery(false)
    return { error }
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    recovery,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
