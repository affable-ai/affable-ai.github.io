import { Link } from 'react-router-dom'
import { Coins, Cpu, Globe, Lock } from 'lucide-react'
import { OfficialBadge } from '@/components/official-badge'
import { humanParams, usd, type Model } from '@/lib/api'
import { ModelArt } from '@/components/model-art'

export function ModelCard({ m }: { m: Model }) {
  return (
    <Link to={`/models/${m.slug}`} className="group flex flex-col overflow-hidden rounded-md border border-foreground/40 bg-card transition-colors hover:border-foreground">
      <div className="aspect-[3/2] overflow-hidden border-b border-foreground/20">
        <ModelArt m={m} className="size-full transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="flex items-center gap-2 truncate text-2xl leading-tight tracking-tight">
          {m.owner_official && <OfficialBadge className="size-6" />}
          <span className="truncate"><span className="font-light text-muted-foreground">{m.owner}</span><span className="px-1.5 text-muted-foreground/60">/</span><span className="font-semibold">{m.name}</span></span>
        </h3>
        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-foreground/90">{m.description || <span className="text-muted-foreground">No description</span>}</p>
        <div className="mt-auto flex items-center justify-between pt-6">
          {m.latest ? <div className="flex flex-col gap-1"><span className="inline-flex items-center gap-2 text-[15px] text-orange-400"><Cpu className="size-4" />{humanParams(m.latest.params)} params</span>
            {m.runnable && m.price_per_million != null && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground" title="Cloud price per 1,000,000 billable boxes (detections above 25% confidence)"><Coins className="size-4" />{usd(m.price_per_million)} per 1M boxes</span>}</div> : <span />}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/40 px-3 py-1 text-sm">{m.public ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}{m.public ? 'Public' : 'Private'}</span>
        </div>
      </div>
    </Link>
  )
}
