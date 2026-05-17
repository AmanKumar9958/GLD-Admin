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
    let isMounted = true

    const fetchRoleAndSetUser = async (currentSession) => {
      if (!currentSession?.user) {
        if (isMounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
        return
      }

      // Fetch the role from the users table
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentSession.user.id)
        .single()

      if (isMounted) {
        setSession(currentSession)
        // Attach the role to the user object
        setUser({ ...currentSession.user, role: userData?.role })
        setLoading(false)
      }
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchRoleAndSetUser(session)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true)
      fetchRoleAndSetUser(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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

      // Verify the user is actually an admin before allowing the login
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userData?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Unauthorized: Admin access required')
      }

      setUser({ ...data.user, role: userData.role })
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
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // Show a blank screen or spinner while verifying role
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div> 
  }

  // Reject unauthenticated users OR users who are not admins
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
