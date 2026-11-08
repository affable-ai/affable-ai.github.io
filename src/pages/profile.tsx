import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import { api, type Profile } from '@/lib/api'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { Avatar } from '@/components/avatar'
import { OfficialBadge } from '@/components/official-badge'
import { ModelCard } from '@/components/model-card'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const { username = '' } = useParams()
  const [p, setP] = useState<Profile | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => { setP(null); setMissing(false); api.profile(username).then(setP).catch(() => setMissing(true)) }, [username])

  const body = missing
    ? <div className="py-24 text-center"><h1 className="text-2xl font-semibold">Not found</h1><Button asChild variant="link"><Link to="/discover">Back to Discover</Link></Button></div>
    : !p ? null : (
      <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Avatar username={p.username} src={p.avatar} className="aspect-square w-full max-w-[18rem]" />
          <div>
            <h1 className="flex items-center gap-2.5 text-4xl font-semibold tracking-tight break-all">{p.username}{p.official && <OfficialBadge kind="account" className="size-8" />}</h1>
            {p.name && <div className="mt-1 text-2xl font-light text-muted-foreground">{p.name}</div>}
          </div>
          {p.bio && <p className="leading-relaxed text-muted-foreground">{p.bio}</p>}
          {p.website && (
            <a href={p.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-start gap-3 break-all underline underline-offset-4 hover:text-muted-foreground">
              <Link2 className="mt-0.5 size-5 shrink-0" />{p.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {p.is_me && <Button asChild variant="outline"><Link to="/dashboard/settings">Edit profile</Link></Button>}
        </aside>
        <section>
          <div className="grid gap-6 sm:grid-cols-2">{p.models.map((m) => <ModelCard key={m.slug} m={m} />)}</div>
          {p.models.length === 0 && <p className="border border-dashed p-12 text-center text-muted-foreground">{p.is_me ? 'You haven’t pushed any models yet.' : 'No public models yet.'}</p>}
        </section>
      </div>
    )

  return <div className="min-h-svh bg-background"><SiteHeader /><main className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">{body}</main><SiteFooter /></div>
}
