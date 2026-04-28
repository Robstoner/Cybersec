import { useState, useEffect, type SubmitEvent } from 'react'
import { Link } from 'react-router'
import { getProfile, updateProfile, fetchAvatar } from '../api/profile'
import { extractErrorMessage } from '../utils/errors'
import type { ProfileResponse } from '../types/profile'

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [gender, setGender] = useState('')
  const [fitnessGoal, setFitnessGoal] = useState('')
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
        setHeightCm(data.heightCm?.toString() ?? '')
        setWeightKg(data.weightKg?.toString() ?? '')
        setGender(data.gender ?? '')
        setFitnessGoal(data.fitnessGoal ?? '')
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
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        gender: gender || undefined,
        fitnessGoal: fitnessGoal || undefined,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
          <Link to="/" className="text-sm text-blue-600 hover:underline">Back</Link>
        </div>

        {profile && (
          <p className="text-xs text-gray-400 mb-4">
            {profile.email} &middot; {profile.roles.join(', ')}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z0-9_]+$"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label htmlFor="fitnessGoal" className="block text-sm font-medium text-gray-700 mb-1">Fitness Goal</label>
            <input
              id="fitnessGoal"
              type="text"
              value={fitnessGoal}
              onChange={e => setFitnessGoal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                id="heightCm"
                type="number"
                step="0.1"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                id="weightKg"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture URL
            </label>
            <div className="flex gap-2">
              <input
                id="avatarUrl"
                type="text"
                value={avatarUrl}
                onChange={e => { setAvatarUrl(e.target.value); setAvatarFetchContent(null) }}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isFetching ? 'Fetching…' : 'Fetch Preview'}
              </button>
            </div>

            {avatarFetchContent !== null && (
              <div className="mt-2">
                {avatarUrl.match(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i) ? (
                  <img
                    src={`data:image/*;base64,${btoa(avatarFetchContent)}`}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                    {avatarFetchContent}
                  </pre>
                )}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Profile updated successfully.</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
