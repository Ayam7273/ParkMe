import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const AuthContext = createContext(null)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseAnonKey || 'public-anon-key'
)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only initialize if Supabase is properly configured
    if (!supabaseUrl || supabaseUrl === 'https://demo.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'public-anon-key') {
      setLoading(false)
      return
    }

    try {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess)
      })
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session)
        setLoading(false)
      }).catch((error) => {
        console.warn('Supabase auth error:', error)
        setLoading(false)
      })
      return () => {
        if (listener?.subscription) {
          listener.subscription.unsubscribe()
        }
      }
    } catch (error) {
      console.warn('Supabase initialization error:', error)
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      signInWithMagic: async (email) => {
        await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      },
      signOut: () => supabase.auth.signOut(),
    }),
    [session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
