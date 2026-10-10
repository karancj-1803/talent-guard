import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { ShieldAlert } from 'lucide-react'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center animate-pulse mb-3">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs font-mono text-slate-400">Restoring TalentGuard Secure Session...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ? children : <Outlet />
}
