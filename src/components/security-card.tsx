import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Download, Loader2, ShieldCheck, Smartphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError, ago, type Device, type Security } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Something went wrong')

/** Settings > Phone approval: turn it on or off, see the registered phones, get recovery codes. */
export function SecurityCard() {
  const [sec, setSec] = useState<Security | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [pw, setPw] = useState(''), [busy, setBusy] = useState(false)
  const [codes, setCodes] = useState<string[] | null>(null)
  const load = useCallback(async () => { try { const [s, d] = await Promise.all([api.security(), api.devices()]); setSec(s); setDevices(d) } catch (e) { fail(e) } }, [])
  useEffect(() => { void load() }, [load])
  if (!sec) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading</div>

  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn() } catch (e) { fail(e) } finally { setBusy(false); setPw('') } }
  const toggle = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const r = await api.setSecurity(!sec.phone_2fa, pw); await load()
    if (r.recovery_codes) setCodes(r.recovery_codes); else { setCodes(null); toast.success('Phone approval is off') }
  }) }
  const save = () => { if (!codes) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`affable recovery codes\\nEach works once. Keep them somewhere safe.\\n\\n${codes.join('\\n')}\\n`], { type: 'text/plain' })); a.download = 'affable-recovery-codes.txt'; a.click() }
  const needsPw = sec.has_password

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 text-sm">
        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border bg-card">{sec.phone_2fa ? <ShieldCheck className="size-4 text-emerald-400" /> : <Smartphone className="size-4" />}</div>
        <div><div className="font-medium">{sec.phone_2fa ? 'On: your phone approves every sign-in' : 'Off'}</div>
          <p className="mt-1 text-muted-foreground">{sec.phone_2fa ? 'Signing in on a new browser or computer shows a code, and your phone has to scan and approve it. That covers GitHub and Google sign-ins too.' : sec.devices ? 'Turn it on so a password alone is not enough to get into your account.' : 'Install the Discovery app and sign in once. That registers your phone, and then you can turn this on.'}</p></div>
      </div>

      {codes && (
        <div className="space-y-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4" role="alert">
          <div className="text-sm font-medium">Your recovery codes</div>
          <p className="text-sm text-muted-foreground">If you lose your phone, each of these signs you in once. This is the only time they are shown, so save them now.</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm" data-testid="recovery-codes">{codes.map((c) => <span key={c}>{c}</span>)}</div>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={save}><Download />Save as a file</Button><Button size="sm" variant="ghost" onClick={() => setCodes(null)}>I saved them</Button></div>
        </div>
      )}

      {(sec.phone_2fa || sec.devices > 0) && (
        <form onSubmit={toggle} className="flex max-w-md flex-wrap items-end gap-3">
          {needsPw && <div className="min-w-48 flex-1 space-y-1.5"><label className="text-sm font-medium" htmlFor="sec-pw">Your password</label><Input id="sec-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-10" required /></div>}
          <Button type="submit" variant={sec.phone_2fa ? 'outline' : 'default'} className="h-10" disabled={busy || (needsPw && !pw)}>{busy && <Loader2 className="animate-spin" />}{sec.phone_2fa ? 'Turn off' : 'Turn on'}</Button>
          {sec.phone_2fa && needsPw && <Button type="button" variant="ghost" className="h-10" disabled={busy || !pw} onClick={() => void run(async () => { setCodes((await api.newRecoveryCodes(pw)).recovery_codes); await load() })}>New recovery codes</Button>}
        </form>
      )}
      {sec.phone_2fa && <p className="text-xs text-muted-foreground">{sec.recovery_codes_left} recovery code{sec.recovery_codes_left === 1 ? '' : 's'} left.</p>}

      {devices.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-medium">Your phones</div>
          <ul className="divide-y border">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3"><Smartphone className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><div className="truncate font-medium">{d.name}</div><div className="text-xs text-muted-foreground">{d.last_seen ? `Last used ${ago(d.last_seen)}` : 'Not used yet'}</div></div></div>
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${d.name}`} disabled={busy || (sec.phone_2fa && devices.length === 1)} title={sec.phone_2fa && devices.length === 1 ? 'Turn off phone approval to remove your last phone' : undefined} onClick={() => void run(async () => { await api.deleteDevice(d.id); await load() })}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
