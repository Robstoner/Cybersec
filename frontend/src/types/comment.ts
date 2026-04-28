export interface Comment {
  id: number
  body: string
  author: string
  authorAvatarUrl: string | null
  createdAt: string
  canDelete: boolean
}
