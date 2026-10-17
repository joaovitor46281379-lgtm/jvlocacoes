import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  accessDenied: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getAllowedEmails(): string[] {
  const raw = import.meta.env.VITE_ADMIN_ALLOWED_EMAILS ?? ''
  return raw
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Verificação de email permitido após login
  useEffect(() => {
    if (!user) return

    const allowedEmails = getAllowedEmails()

    // Se a lista de emails permitidos está vazia, permite todos (ambiente de desenvolvimento)
    if (allowedEmails.length === 0) return

    const userEmail = user.email?.toLowerCase() ?? ''

    if (!allowedEmails.includes(userEmail)) {
      setAccessDenied(true)
      supabase.auth.signOut()
    }
  }, [user])

  const signInWithGoogle = async () => {
    const redirectTo = window.location.origin + '/admin/login'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      console.error('Erro ao fazer login:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Erro ao fazer logout:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        accessDenied,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
