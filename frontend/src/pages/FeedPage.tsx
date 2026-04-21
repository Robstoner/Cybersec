import { useEffect, useState, type SubmitEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { listPosts, searchPosts, createPost, deletePost } from '../api/posts'
import type { Post } from '../types/post'
import { extractErrorMessage } from '../utils/errors'

export function FeedPage() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  async function loadFeed() {
    try {
      setLoadError(null)
      setPosts(await listPosts())
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Failed to load the feed.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      setLoadError(null)
      if (searchQuery.trim() === '') {
        setPosts(await listPosts())
      } else {
        setPosts(await searchPosts(searchQuery))
      }
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Search failed.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  function handleLogout() {
    logout()
    navigate('/home')
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setImage(e.target.files?.[0] ?? null)
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)
    try {
      const created = await createPost(title, body, image)
      setPosts(prev => [created, ...prev])
      setTitle('')
      setBody('')
      setImage(null)
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setSubmitError(extractErrorMessage(err, 'Failed to create the post.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(postId: number) {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      alert(extractErrorMessage(err, 'Failed to delete the post.'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Feed</h1>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-gray-500">{user.username}</span>
                <Link
                  to="/profile"
                  className="bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-red-600 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link
                  to="/admin/users"
                  className="bg-purple-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-blue-700 transition-colors"
                >
                  Roles
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {user ? (
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">New post</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="What's on your mind?"
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="file"
                onChange={handleFileChange}
                className="text-sm text-gray-600"
              />
              {submitError && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </form>
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow p-6 text-center">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
              {' '}or{' '}
              <Link to="/register" className="text-blue-600 hover:underline">register</Link>
              {' '}to create a post.
            </p>
          </section>
        )}

        <section className="bg-white rounded-2xl shadow p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search posts by title…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </section>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {loadError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {loadError}
          </p>
        )}

        {!loading && posts.length === 0 && !loadError && (
          <p className="text-sm text-gray-500 text-center">No posts yet. Be the first!</p>
        )}

        {posts.map(post => (
          <article key={post.id} className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-start justify-between gap-3 mb-2">
              <Link to={`/posts/${post.id}`} className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
              </Link>
              {post.canDelete && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3">
              by {post.author} · {new Date(post.createdAt).toLocaleString()}
            </p>
            <div
              className="text-sm text-gray-700 whitespace-pre-wrap mb-3"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt=""
                className="max-h-96 rounded-lg border border-gray-200"
              />
            )}
            <div className="mt-3">
              <Link
                to={`/posts/${post.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View comments →
              </Link>
            </div>
          </article>
        ))}
      </main>
    </div>
  )
}
