import apiClient from './client'
import type { Comment } from '../types/comment'

export async function addComment(postId: number, body: string): Promise<Comment> {
  const response = await apiClient.post<Comment>(`/posts/${postId}/comments`, { body })
  return response.data
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`)
}
