import apiClient from './client'
import type { Post } from '../types/post'

export async function listPosts(): Promise<Post[]> {
  const response = await apiClient.get<Post[]>('/posts')
  return response.data
}

export interface PostFilters {
  q?: string
  author?: string
  sort?: 'newest' | 'oldest'
  from?: string
  to?: string
}

export async function searchPosts(filters: PostFilters): Promise<Post[]> {
  const params: Record<string, string> = {}
  if (filters.q) params.q = filters.q
  if (filters.author) params.author = filters.author
  if (filters.sort) params.sort = filters.sort
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  const response = await apiClient.get<Post[]>('/posts/search', { params })
  return response.data
}

export async function listAuthors(): Promise<string[]> {
  const response = await apiClient.get<string[]>('/posts/authors')
  return response.data
}

export async function getPost(id: number): Promise<Post> {
  const response = await apiClient.get<Post>(`/posts/${id}`)
  return response.data
}

export async function createPost(
  title: string,
  body: string,
  image: File | null,
): Promise<Post> {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('body', body)
  if (image) {
    formData.append('image', image)
  }
  const response = await apiClient.post<Post>('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`/posts/${id}`)
}
