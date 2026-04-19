import type { Comment } from './comment'

export interface Post {
  id: number
  title: string
  body: string
  imageUrl: string | null
  author: string
  createdAt: string
  canDelete: boolean
  comments: Comment[] | null
}
