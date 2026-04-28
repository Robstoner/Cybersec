import { useState } from 'react'

interface AvatarProps {
  username: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const PALETTE = [
  'from-orange-400 to-amber-500',
  'from-rose-400 to-pink-500',
  'from-indigo-400 to-purple-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-fuchsia-400 to-purple-500',
  'from-yellow-400 to-orange-500',
  'from-green-400 to-emerald-500',
]

function pickGradient(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function Avatar({ username, src, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false)

  const dimensions = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  }[size]

  const showImage = src && !failed
  const initials = username.slice(0, 2).toUpperCase()
  const gradient = pickGradient(username)

  return (
    <div className={`${dimensions} rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm`}>
      {showImage ? (
        <img
          src={src!}
          alt={`${username}'s avatar`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold`}>
          {initials}
        </div>
      )}
    </div>
  )
}
