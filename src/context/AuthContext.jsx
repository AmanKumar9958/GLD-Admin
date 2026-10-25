/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const userRef = useRef(null)

  // Keep userRef in sync with state for event listeners
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    let isMounted = true

    const fetchRoleAndSetUser = async (currentSession, isInitial = false) => {
      if (!currentSession?.user) {
        if (isMounted) {
          setSession(null)
          setUser(null)
          if (isInitial) setLoading(false)
        }
        return
      }

      try {
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
        }
      } catch (err) {
        console.error('Error fetching user role:', err)
      } finally {
        if (isMounted && isInitial) {
          setLoading(false)
        }
      }
    }

    // 1. Initial Session Check on app startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchRoleAndSetUser(session, true)
    }).catch(() => {
      if (isMounted) setLoading(false)
    })

    // 2. Listen for auth changes (token refresh, sign in, sign out)
    // NOTE: NEVER call setLoading(true) on tab switch / background token refresh!
    // That was causing the whole app to unmount and wiping all user typed form inputs.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null)
          setSession(null)
          setLoading(false)
        }
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        // Silently update session in background without unmounting pages
        if (isMounted && newSession) {
          setSession(newSession)
        }
        return
      }

      // If user is already authenticated, update silently in the background
      if (userRef.current) {
        fetchRoleAndSetUser(newSession, false)
      } else {
        // Only trigger loading state if we don't have a user yet
        fetchRoleAndSetUser(newSession, true)
      }
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
    // Show a loading screen only during initial app launch
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    )
  }

  // Reject unauthenticated users OR users who are not admins
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
