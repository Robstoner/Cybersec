import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome, {user!.username}!
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Roles: {user!.roles.join(', ') || 'None'}
        </p>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
