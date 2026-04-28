import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Logo'

interface AppShellProps {
  children: ReactNode
  maxWidth?: 'narrow' | 'wide'
}

export function AppShell({ children, maxWidth = 'narrow' }: AppShellProps) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/home')
  }

  const containerWidth = maxWidth === 'wide' ? 'max-w-5xl' : 'max-w-2xl'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className={`${containerWidth} mx-auto px-4 py-3 flex items-center justify-between gap-4`}>
          <Logo />
          <nav className="flex items-center gap-2 text-sm">
            {user ? (
              <>
                <span className="hidden sm:inline text-slate-500 px-2">
                  Hi, <span className="font-medium text-slate-700">{user.username}</span>
                </span>
                {isAdmin && (
                  <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg px-3 py-1.5 font-medium shadow-sm transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
                    </svg>
                    Roles
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg px-3 py-1.5 font-medium transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-slate-700 rounded-lg px-3 py-1.5 font-medium transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-slate-900 px-3 py-1.5 font-medium transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-lg px-4 py-1.5 font-medium shadow-sm hover:shadow-md hover:brightness-105 transition-all"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={`${containerWidth} mx-auto px-4 py-6 space-y-6`}>
        {children}
      </main>
    </div>
  )
}
