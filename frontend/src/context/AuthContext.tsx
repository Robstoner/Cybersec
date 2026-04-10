import { createContext, useState, useEffect, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from '../api/auth'
import type { AuthUser, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'
import { STORAGE_KEYS } from '../constants/storage'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// Decode the JWT payload and check the exp claim without verifying the signature.
// We only use this to avoid showing the dashboard when the token is already expired.
// The backend always validates the signature — this is just a UX shortcut.
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// Validate that a parsed object matches the AuthUser shape before trusting it.
function isValidAuthUser(obj: unknown): obj is AuthUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AuthUser).username === 'string' &&
    Array.isArray((obj as AuthUser).roles) &&
    (obj as AuthUser).roles.every(r => typeof r === 'string')
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const stored = localStorage.getItem(STORAGE_KEYS.USER)
    if (token && stored && !isTokenExpired(token)) {
      try {
        const parsed = JSON.parse(stored)
        if (isValidAuthUser(parsed)) {
          setUser(parsed)
        } else {
          clearStorage()
        }
      } catch {
        clearStorage()
      }
    } else if (token || stored) {
      clearStorage()
    }
    setIsLoading(false)
  }, [])

  function clearStorage() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  function persistAuth(response: AuthResponse) {
    const authUser: AuthUser = { username: response.username, roles: response.roles }
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser))
    setUser(authUser)
  }

  async function login(data: LoginRequest) {
    persistAuth(await apiLogin(data))
  }

  async function register(data: RegisterRequest) {
    persistAuth(await apiRegister(data))
  }

  function logout() {
    clearStorage()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
