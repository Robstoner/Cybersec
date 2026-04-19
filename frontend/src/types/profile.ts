export interface ProfileResponse {
  id: number
  username: string
  email: string
  roles: string[]
  bio: string | null
  heightCm: number | null
  weightKg: number | null
  gender: string | null
  fitnessGoal: string | null
}

export interface UpdateProfileRequest {
  username?: string
  bio?: string
  heightCm?: number
  weightKg?: number
  gender?: string
  fitnessGoal?: string
}
