import { Navigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import type { ReactNode } from 'react'

export function ProtectedRoute({ admin, children }: { admin?: boolean, children: ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (admin && !isAdmin) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}
