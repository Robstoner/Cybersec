import { Navigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
