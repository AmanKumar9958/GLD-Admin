/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (sbError) throw sbError

      setUser(data.user)
      setSession(data.session)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }


  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const value = useMemo(
    () => ({
      user,
      session,
      error,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, session, error, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null // Or a global spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

