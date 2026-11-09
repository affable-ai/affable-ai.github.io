import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ago, api, ApiError, usd, type Credits } from '@/lib/api'

const untilReset = (at: number) => {
  const m = Math.max(1, Math.round((at - Date.now() / 1000) / 60))
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

/** Settings > Credits: what is left, when the free credits refill, and what the latest runs cost. */
export function CreditsCard() {
  const [c, setC] = useState<Credits | null>(null), [err, setErr] = useState<string | null>(null)
  useEffect(() => { api.credits().then(setC).catch((e) => setErr(e instanceof ApiError ? e.message : 'Couldn’t load your credits')) }, [])
  if (err) return <p className="text-sm text-destructive">{err}</p>
  if (!c) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading</div>
  return (
    <div className="space-y-5">
      <div>
        <div className="text-3xl font-semibold tracking-tight" data-testid="credit-total">{usd(c.total_usd)}</div>
        <p className="mt-1 text-sm text-muted-foreground">{usd(c.free_usd)} free today of {usd(c.daily_usd)}, refilling in {untilReset(c.resets_at)} (00:00 UTC), plus {usd(c.paid_usd)} in credits that don’t expire.{c.unmetered && ' Your account isn’t charged for runs, so this balance stays as it is.'}</p>
      </div>
      <p className="text-sm text-muted-foreground">Running a cloud model is charged per <strong className="text-foreground">billable box</strong>: a detection above 25% confidence, even if you ask to see only the sure ones. Boxes below 25% are free. Each model shows its price per 1M boxes.</p>
      <div className="text-sm"><span className="font-medium">Today</span> <span className="text-muted-foreground">{c.today.runs} run{c.today.runs === 1 ? '' : 's'} · {c.today.boxes.toLocaleString()} billable box{c.today.boxes === 1 ? '' : 'es'} · {usd(c.today.usd)}</span></div>
      {c.recent.length > 0 && (
        <ul className="divide-y rounded-lg border text-sm">
          {c.recent.slice(0, 8).map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-3 py-2"><span className="min-w-0 truncate">{r.kind === 'run' || r.kind === 'prompt' ? r.model : `${r.kind === 'grant' ? 'Credits added' : 'Adjustment'}${r.note ? `: ${r.note}` : ''}`}</span><span className="shrink-0 text-muted-foreground">{r.kind === 'run' || r.kind === 'prompt' ? `${r.boxes} box${r.boxes === 1 ? '' : 'es'} · ${usd(r.usd)}` : `${r.usd > 0 ? '+' : ''}${usd(r.usd)}`} · {ago(r.ts)}</span></li>
          ))}
        </ul>
      )}
    </div>
  )
}
