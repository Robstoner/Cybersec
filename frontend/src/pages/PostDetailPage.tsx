import { useEffect, useState, type SubmitEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { getPost, deletePost } from '../api/posts'
import { addComment, deleteComment } from '../api/comments'
import type { Post } from '../types/post'
import type { Comment } from '../types/comment'
import { extractErrorMessage } from '../utils/errors'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'

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
      setPost({ ...post, comments: [...(post.comments ?? []), created], commentCount: post.commentCount + 1 })
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
        commentCount: Math.max(0, post.commentCount - 1),
      })
    } catch (err) {
      alert(extractErrorMessage(err, 'Failed to delete the comment.'))
    }
  }

  return (
    <AppShell>
      <Link
        to="/home"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors -mt-2"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to feed
      </Link>

      {loading && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-2/3 mb-4" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="h-3 bg-slate-100 rounded w-4/6" />
          </div>
        </div>
      )}

      {loadError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 ring-1 ring-red-100 rounded-lg px-3 py-2">
          {loadError}
        </p>
      )}

      {post && (
        <>
          <article className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
            <div className="flex items-start gap-3 mb-4">
              <Avatar username={post.author} src={post.authorAvatarUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{post.author}</p>
                <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
              {post.canDelete && (
                <button
                  onClick={handleDeletePost}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                  aria-label="Delete post"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                </button>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-3">{post.title}</h1>
            <div
              className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt=""
                className="w-full max-h-[32rem] rounded-xl border border-slate-200 object-cover"
              />
            )}
          </article>

          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comments
              <span className="text-slate-400 font-normal">({post.commentCount})</span>
            </h2>

            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
                <Avatar username={user.username} size="sm" />
                <div className="flex-1 space-y-2">
                  <textarea
                    placeholder="Write a comment…"
                    value={commentBody}
                    onChange={e => setCommentBody(e.target.value)}
                    required
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  />
                  {commentError && (
                    <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      {commentError}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentBody.trim()}
                      className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium shadow-sm hover:shadow-md hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {submittingComment ? 'Posting…' : 'Comment'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-600 mb-6 bg-slate-50 rounded-lg px-3 py-2">
                <Link to="/login" className="text-orange-600 hover:underline font-medium">Sign in</Link>
                {' '}to leave a comment.
              </p>
            )}

            <ul className="space-y-4">
              {(post.comments ?? []).map(c => (
                <li key={c.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                  <Avatar username={c.author} src={c.authorAvatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <span className="font-medium text-slate-800 text-sm">{c.author}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {c.canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c)}
                          className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div
                      className="text-sm text-slate-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: c.body }}
                    />
                  </div>
                </li>
              ))}
              {(post.comments?.length ?? 0) === 0 && (
                <li className="text-sm text-slate-500 text-center py-4">
                  No comments yet — be the first.
                </li>
              )}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  )
}
