export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  username: string
  roles: string[]
}

export interface AuthUser {
  username: string
  roles: string[]
}
