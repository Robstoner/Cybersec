import apiClient from './client'
import type { AdminUser } from '../types/admin'

export async function getUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUser[]>('/admin/users')
  return response.data
}

export async function updateUserRoles(userId: number, roles: string[]): Promise<AdminUser> {
  const response = await apiClient.put<AdminUser>(`/admin/users/${userId}/roles`, { roles })
  return response.data
}

export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}`)
}
