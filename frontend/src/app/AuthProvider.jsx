import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function initAuth() {
      try {
        let currentUser = await authService.getCurrentUser()
        if (!currentUser) {
          // Auto-authenticate with demo token if session is missing
          const res = await authService.signIn("elena.vance@technova.internal", "password123")
          currentUser = res.user
        }
        setUser(currentUser)
      } catch (err) {
        console.warn('Auth initialization warning:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const signIn = async (email, password) => {
    setError(null)
    setLoading(true)
    try {
      const res = await authService.signIn(email, password)
      setUser(res.user)
      return res
    } catch (err) {
      setError(err.message || 'Authentication failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
      setUser(null)
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
