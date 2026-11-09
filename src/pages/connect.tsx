import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Check, Loader2, Terminal, X } from 'lucide-react'
import { api, ApiError, type DeviceRequest } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { SiteHeader, SiteFooter } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
const show = (s: string) => (s.length > 4 ? `${s.slice(0, 4)}-${s.slice(4)}` : s)

/** `affable login` > "Open the browser" ends here: confirm the code the terminal is showing, and the CLI is signed in. */
export default function Connect() {
  const { user, loading } = useAuth()
  const [params, setParams] = useSearchParams()
  const [code, setCode] = useState(clean(params.get('code') ?? ''))
  const [req, setReq] = useState<DeviceRequest | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'approved' | 'denied' | null>(null)

  const look = async (c: string) => {
    setBusy(true); setErr(null)
    try { setReq(await api.deviceLookup(c)) } catch (e) { setReq(null); setErr(e instanceof ApiError ? e.message : 'Something went wrong') } finally { setBusy(false) }
  }
  useEffect(() => { if (user && code.length === 8 && !req && !err && !done) void look(code) }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Loading…</div>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent('/connect' + (code ? `?code=${show(code)}` : ''))}`} replace />

  const submit = (e: FormEvent) => { e.preventDefault(); if (code.length === 8) { setParams({ code: show(code) }, { replace: true }); void look(code) } }
  const answer = async (yes: boolean) => {
    setBusy(true); setErr(null)
    try { await (yes ? api.deviceApprove(code) : api.deviceDeny(code)); setDone(yes ? 'approved' : 'denied') } catch (e) { setErr(e instanceof ApiError ? e.message : 'Something went wrong') } finally { setBusy(false) }
  }

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-center gap-2 text-muted-foreground"><Terminal className="size-5" /><span className="text-sm">affable command line</span></div>
        {done === 'approved' ? (
          <div className="space-y-3"><h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Check className="size-6" />You’re connected</h1>
            <p className="text-muted-foreground">Your terminal is signed in as <strong className="text-foreground">{user.username}</strong>. You can close this tab.</p>
            <p className="text-sm text-muted-foreground">The key it was given is listed under <Link to="/dashboard/keys" className="underline">API keys</Link> as “affable CLI”, where you can remove it any time.</p></div>
        ) : done === 'denied' ? (
          <div className="space-y-3"><h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><X className="size-6" />Declined</h1><p className="text-muted-foreground">Nothing was connected. If that wasn’t you, you can ignore it.</p></div>
        ) : req ? (
          <div className="space-y-5">
            <h1 className="text-2xl font-semibold tracking-tight">Connect the command line?</h1>
            <p className="text-muted-foreground">A terminal is asking to sign in as <strong className="text-foreground">{req.account}</strong>. Only continue if you just ran <code className="bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">affable login</code> and the code below matches.</p>
            <div className="border px-4 py-5 text-center font-mono text-3xl tracking-[0.3em]" aria-label="Code">{req.code}</div>
            <dl className="space-y-1 text-sm text-muted-foreground">
              {req.ip && <div className="flex justify-between gap-4"><dt>From</dt><dd className="font-mono text-foreground">{req.ip}</dd></div>}
              {req.agent && <div className="flex justify-between gap-4"><dt>Program</dt><dd className="truncate text-foreground">{req.agent}</dd></div>}
              <div className="flex justify-between gap-4"><dt>Expires in</dt><dd className="text-foreground">{Math.max(1, Math.round(req.expires_in / 60))} min</dd></div>
            </dl>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-3"><Button className="flex-1" disabled={busy} onClick={() => answer(true)}>{busy && <Loader2 className="animate-spin" />}Connect</Button><Button variant="outline" className="flex-1" disabled={busy} onClick={() => answer(false)}>Decline</Button></div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <h1 className="text-2xl font-semibold tracking-tight">Connect the command line</h1>
            <p className="text-muted-foreground">Run <code className="bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">affable login</code>, choose <em>Open the browser</em>, and type the code it shows.</p>
            <Input value={show(code)} onChange={(e) => { setCode(clean(e.target.value)); setErr(null) }} placeholder="ABCD-EFGH" autoFocus autoComplete="off" spellCheck={false} aria-label="Code" className="h-14 text-center font-mono text-2xl tracking-[0.25em] uppercase" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 8}>{busy && <Loader2 className="animate-spin" />}Continue</Button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
