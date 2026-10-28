/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const CACHED_USER_KEY = 'gld_admin_user'

function getInitialUser() {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.role === 'admin') {
        return parsed
      }
    }
  } catch (e) {
    console.error('Error reading cached admin user:', e)
  }
  return null
}

export const AuthProvider = ({ children }) => {
  const initialUser = useMemo(() => getInitialUser(), [])
  const [user, setUser] = useState(initialUser)
  const [session, setSession] = useState(null)
  // If we already have a cached admin user, do not show full-page loading
  const [loading, setLoading] = useState(!initialUser)
  const [error, setError] = useState(null)
  const userRef = useRef(initialUser)

  // Keep userRef in sync with state for event listeners
  useEffect(() => {
    userRef.current = user
    if (user && user.role === 'admin') {
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user))
      } catch (e) {}
    } else if (!user) {
      try {
        localStorage.removeItem(CACHED_USER_KEY)
      } catch (e) {}
    }
  }, [user])

  useEffect(() => {
    let isMounted = true

    const syncSession = async (currentSession) => {
      if (!currentSession?.user) {
        return
      }

      // If user is already authenticated as admin, keep session in sync without re-fetching role
      if (userRef.current?.role === 'admin' && userRef.current.id === currentSession.user.id) {
        if (isMounted) {
          setSession(currentSession)
          setLoading(false)
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
          if (userData?.role === 'admin') {
            const adminUser = { ...currentSession.user, role: 'admin' }
            setUser(adminUser)
            setSession(currentSession)
          } else {
            setUser(null)
            setSession(null)
            try {
              localStorage.removeItem(CACHED_USER_KEY)
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error fetching user role:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // 1. Initial Session Check on app startup
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        syncSession(s)
      } else {
        if (isMounted) {
          // No active session in supabase storage
          setUser(null)
          setSession(null)
          setLoading(false)
          try {
            localStorage.removeItem(CACHED_USER_KEY)
          } catch (e) {}
        }
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })

    // 2. Listen for auth changes (token refresh, tab refocus, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null)
          setSession(null)
          setLoading(false)
          try {
            localStorage.removeItem(CACHED_USER_KEY)
          } catch (e) {}
        }
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        if (isMounted && newSession) {
          setSession(newSession)
        }
        return
      }

      // On tab focus or sign in, sync quietly without unmounting
      if (newSession) {
        syncSession(newSession)
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

      const adminUser = { ...data.user, role: userData.role }
      setUser(adminUser)
      setSession(data.session)
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(adminUser))
      } catch (e) {}
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem(CACHED_USER_KEY)
    } catch (e) {}
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
