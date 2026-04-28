import apiClient from './client'
import type { ProfileResponse, UpdateProfileRequest } from '../types/profile'

export async function getProfile(): Promise<ProfileResponse> {
  const response = await apiClient.get<ProfileResponse>('/profile')
  return response.data
}

export async function updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
  const response = await apiClient.put<ProfileResponse>('/profile', data)
  return response.data
}

export async function fetchAvatar(url: string): Promise<string> {
  const response = await apiClient.post<{ content: string }>('/profile/fetch-avatar', { url })
  return response.data.content
}
