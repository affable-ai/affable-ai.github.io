import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/config'
import { InkArt } from '@/components/ink-art'

/** A user's/org's picture. Falls back to a generated ink painting seeded by their username. */
export function Avatar({ username, src, className = 'size-12', rounded = 'rounded-md' }: { username: string; src?: string | null; className?: string; rounded?: string }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [src])
  return (
    <div className={`shrink-0 overflow-hidden ${rounded} ${className}`}>
      {src && !bad
        ? <img src={apiUrl(src)} alt={username} className="size-full object-cover" onError={() => setBad(true)} />
        : <InkArt seed={`user:${username}`} className="size-full" />}
    </div>
  )
}
