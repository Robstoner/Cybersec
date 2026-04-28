import type { Comment } from './comment'

export interface Post {
  id: number
  title: string
  body: string
  imageUrl: string | null
  author: string
  authorAvatarUrl: string | null
  commentCount: number
  createdAt: string
  canDelete: boolean
  comments: Comment[] | null
}
