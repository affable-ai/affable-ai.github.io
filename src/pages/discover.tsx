import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api, type Model } from '@/lib/api'
import { SiteHeader, SiteFooter } from '@/components/site-header'
import { ModelCard } from '@/components/model-card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export default function Discover() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [models, setModels] = useState<Model[] | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { api.discover(q).then(setModels).catch(() => setModels([])) }, 150)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Discover</h1>
        <div className="relative mt-6 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} placeholder="Search models" className="h-10 pl-9" autoFocus />
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {models === null && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72" />)}
          {models?.map((m) => <ModelCard key={m.slug} m={m} />)}
        </div>
        {models?.length === 0 && <p className="py-24 text-center text-sm text-muted-foreground">{q ? 'No matches.' : 'No public models yet.'}</p>}
      </main>
      <SiteFooter />
    </div>
  )
}
