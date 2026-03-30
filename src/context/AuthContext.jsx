/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

// NOTE: Hardcoded credentials are for demo purposes only. Replace with real auth (e.g., Firebase Auth).
const ADMIN_EMAIL = 'admin@gld2026'
const ADMIN_PASSWORD = 'admin@gld'
const STORAGE_KEY = 'gld-admin-user'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const authenticatedUser = { email }
        setUser(authenticatedUser)
        return { success: true }
      }

      throw new Error('Invalid credentials')
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => setUser(null)

  const value = useMemo(
    () => ({
      user,
      error,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, error, loading],
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
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
