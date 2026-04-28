import { useEffect, useState, type SubmitEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { listPosts, listAuthors, searchPosts, createPost, deletePost } from '../api/posts'
import type { Post } from '../types/post'
import { extractErrorMessage } from '../utils/errors'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-slate-200" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-200 rounded w-1/3" />
          <div className="h-2 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
      <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
      </div>
    </div>
  )
}

export function FeedPage() {
  const { user } = useAuth()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [sortFilter, setSortFilter] = useState<'newest' | 'oldest'>('newest')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  function filtersAreEmpty() {
    return (
      searchQuery.trim() === '' &&
      authorFilter === '' &&
      sortFilter === 'newest' &&
      fromFilter === '' &&
      toFilter === ''
    )
  }

  async function handleSearch(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      setLoadError(null)
      if (filtersAreEmpty()) {
        setPosts(await listPosts())
      } else {
        setPosts(await searchPosts({
          q: searchQuery.trim() || undefined,
          author: authorFilter || undefined,
          sort: sortFilter,
          from: fromFilter || undefined,
          to: toFilter || undefined,
        }))
      }
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Search failed.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleClearFilters() {
    setSearchQuery('')
    setAuthorFilter('')
    setSortFilter('newest')
    setFromFilter('')
    setToFilter('')
    setLoading(true)
    try {
      setLoadError(null)
      setPosts(await listPosts())
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Failed to load the feed.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
    listAuthors()
      .then(setAuthors)
      .catch(() => { /* dropdown is non-critical; silently fall back to empty */ })
  }, [])

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
      setComposerOpen(false)
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
    <AppShell>
      {user ? (
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
          {composerOpen ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <Avatar username={user.username} />
                <div>
                  <p className="font-medium text-slate-800 text-sm">{user.username}</p>
                  <p className="text-xs text-slate-500">Posting to the feed</p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              <textarea
                placeholder="What's on your mind?"
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4a3 3 0 014 0l4 4M14 14l1-1a3 3 0 014 0l1 1M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{image ? image.name : 'Add image'}</span>
                  <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium shadow-sm hover:shadow-md hover:brightness-105 disabled:opacity-50 transition-all"
                  >
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
              {submitError && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
            </form>
          ) : (
            <button
              onClick={() => setComposerOpen(true)}
              className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
            >
              <Avatar username={user.username} />
              <span className="flex-1 text-slate-500 text-sm bg-slate-50 hover:bg-white rounded-full px-4 py-2 border border-slate-200">
                What's on your mind, {user.username}?
              </span>
            </button>
          )}
        </section>
      ) : (
        <section className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-sm p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to the Forum</h2>
          <p className="text-orange-50 mb-4 text-sm max-w-md mx-auto">
            Join the conversation, share what's on your mind, and follow what the community is talking about.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link
              to="/register"
              className="bg-white text-orange-600 rounded-lg px-5 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="text-white border border-white/40 rounded-lg px-5 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
        <form onSubmit={handleSearch}>
          <div className="p-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search posts by title…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(o => !o)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filtersOpen ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
              aria-expanded={filtersOpen}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            <button
              type="submit"
              className="bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Search
            </button>
          </div>

          {filtersOpen && (
            <div className="border-t border-slate-100 p-3 space-y-3 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Author</label>
                  <select
                    value={authorFilter}
                    onChange={e => setAuthorFilter(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">All authors</option>
                    {authors.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sort</label>
                  <select
                    value={sortFilter}
                    onChange={e => setSortFilter(e.target.value as 'newest' | 'oldest')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
                  <input
                    type="date"
                    value={fromFilter}
                    onChange={e => setFromFilter(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
                  <input
                    type="date"
                    value={toFilter}
                    onChange={e => setToFilter(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      {loading && (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {loadError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 ring-1 ring-red-100 rounded-lg px-3 py-2">
          {loadError}
        </p>
      )}

      {!loading && posts.length === 0 && !loadError && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-12 text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-orange-50 text-orange-500 items-center justify-center mb-3">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">No posts yet</p>
          <p className="text-sm text-slate-500 mt-1">Be the first to post.</p>
        </div>
      )}

      {!loading && posts.map(post => (
        <article key={post.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 hover:ring-slate-200 transition-shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-3">
              <Avatar username={post.author} src={post.authorAvatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{post.author}</p>
                <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
              {post.canDelete && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                  aria-label="Delete post"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                </button>
              )}
            </div>

            <Link to={`/posts/${post.id}`} className="block group">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors mb-2">
                {post.title}
              </h3>
            </Link>
            <div
              className="text-sm text-slate-700 whitespace-pre-wrap mb-3 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt=""
                className="w-full max-h-96 rounded-xl border border-slate-200 object-cover mb-3"
              />
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
              <Link
                to={`/posts/${post.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-orange-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
              </Link>
            </div>
          </div>
        </article>
      ))}
    </AppShell>
  )
}
