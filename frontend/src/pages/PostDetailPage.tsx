import { useEffect, useState, type SubmitEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { getPost, deletePost } from '../api/posts'
import { addComment, deleteComment } from '../api/comments'
import type { Post } from '../types/post'
import type { Comment } from '../types/comment'
import { extractErrorMessage } from '../utils/errors'

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const postId = id ? Number(id) : NaN

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [commentBody, setCommentBody] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(postId)) {
      setLoadError('Invalid post id.')
      setLoading(false)
      return
    }
    getPost(postId)
      .then(setPost)
      .catch(err => setLoadError(extractErrorMessage(err, 'Failed to load the post.')))
      .finally(() => setLoading(false))
  }, [postId])

  async function handleDeletePost() {
    if (!post) return
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(post.id)
      navigate('/home')
    } catch (err) {
      alert(extractErrorMessage(err, 'Failed to delete the post.'))
    }
  }

  async function handleAddComment(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!post) return
    setCommentError(null)
    setSubmittingComment(true)
    try {
      const created = await addComment(post.id, commentBody)
      setPost({ ...post, comments: [...(post.comments ?? []), created] })
      setCommentBody('')
    } catch (err) {
      setCommentError(extractErrorMessage(err, 'Failed to add the comment.'))
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleDeleteComment(comment: Comment) {
    if (!post) return
    if (!confirm('Delete this comment?')) return
    try {
      await deleteComment(comment.id)
      setPost({
        ...post,
        comments: (post.comments ?? []).filter(c => c.id !== comment.id),
      })
    } catch (err) {
      alert(extractErrorMessage(err, 'Failed to delete the comment.'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/home" className="text-sm text-blue-600 hover:underline">
            ← Back to feed
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {loadError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {loadError}
          </p>
        )}

        {post && (
          <>
            <article className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-xl font-semibold text-gray-800 flex-1">{post.title}</h1>
                {post.canDelete && (
                  <button
                    onClick={handleDeletePost}
                    className="text-xs text-red-600 hover:text-red-800 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                by {post.author} · {new Date(post.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{post.body}</p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="max-h-[32rem] rounded-lg border border-gray-200"
                />
              )}
            </article>

            <section className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Comments ({post.comments?.length ?? 0})
              </h2>

              {user ? (
                <form onSubmit={handleAddComment} className="space-y-3 mb-6">
                  <textarea
                    placeholder="Write a comment…"
                    value={commentBody}
                    onChange={e => setCommentBody(e.target.value)}
                    required
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {commentError && (
                    <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      {commentError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submittingComment ? 'Posting…' : 'Comment'}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-600 mb-6">
                  <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                  {' '}to comment.
                </p>
              )}

              <ul className="space-y-4">
                {(post.comments ?? []).map(c => (
                  <li key={c.id} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs text-gray-500 mb-1">
                        {c.author} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                      {c.canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c)}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
                {(post.comments?.length ?? 0) === 0 && (
                  <li className="text-sm text-gray-500">No comments yet.</li>
                )}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
