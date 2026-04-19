export interface AdminUser {
  id: number
  username: string
  email: string
  enabled: boolean
  roles: string[]
  createdAt: string
}
