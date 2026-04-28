import { useState, useEffect, type SubmitEvent } from 'react'
import { getProfile, updateProfile, fetchAvatar } from '../api/profile'
import { extractErrorMessage } from '../utils/errors'
import type { ProfileResponse } from '../types/profile'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFetchContent, setAvatarFetchContent] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data)
        setUsername(data.username)
        setBio(data.bio ?? '')
        setAvatarUrl(data.avatarUrl ?? '')
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load profile.')))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)
    try {
      const updated = await updateProfile({
        username,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
      })
      setProfile(updated)
      setSuccess(true)
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update profile.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-8 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-9 bg-slate-100 rounded" />
            <div className="h-9 bg-slate-100 rounded" />
            <div className="h-9 bg-slate-100 rounded" />
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 h-24" />
        <div className="px-8 pb-8 -mt-10">
          <div className="flex items-end gap-4 mb-4">
            <Avatar username={username || 'You'} src={avatarUrl} size="lg" />
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-slate-900">{username || 'Your profile'}</h1>
              {profile && (
                <p className="text-xs text-slate-500">
                  {profile.email} · {profile.roles.map(r => r.replace('ROLE_', '').toLowerCase()).join(', ')}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z0-9_]+$"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell the community a little about yourself…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-slate-700 mb-1">
                Profile picture URL
              </label>
              <div className="flex gap-2">
                <input
                  id="avatarUrl"
                  type="text"
                  value={avatarUrl}
                  onChange={e => { setAvatarUrl(e.target.value); setAvatarFetchContent(null) }}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                <button
                  type="button"
                  disabled={isFetching || !avatarUrl}
                  onClick={async () => {
                    setIsFetching(true)
                    setAvatarFetchContent(null)
                    try {
                      const content = await fetchAvatar(avatarUrl)
                      setAvatarFetchContent(content)
                    } catch (err) {
                      setAvatarFetchContent('Error: ' + extractErrorMessage(err, 'Fetch failed.'))
                    } finally {
                      setIsFetching(false)
                    }
                  }}
                  className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap font-medium text-slate-700"
                >
                  {isFetching ? 'Fetching…' : 'Fetch preview'}
                </button>
              </div>

              {avatarFetchContent !== null && (
                <div className="mt-2">
                  {avatarUrl.match(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i) ? (
                    <img
                      src={`data:image/*;base64,${btoa(avatarFetchContent)}`}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border border-slate-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                      {avatarFetchContent}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 ring-1 ring-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100 rounded-lg px-3 py-2">Profile updated successfully.</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-lg py-2.5 text-sm font-semibold shadow-sm hover:shadow-md hover:brightness-105 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
