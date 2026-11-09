import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Loader2, Search, ShieldCheck } from 'lucide-react'
import { ago, api, ApiError, humanParams, usd, type AuditRow, type ConsoleOverview, type ConsoleUser, type ConsoleUserDetail, type PricingSettings } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { OfficialBadge } from '@/components/official-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong')
const fmt = (n: number) => n.toLocaleString()
type Tab = 'overview' | 'users' | 'pricing' | 'audit'

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return <div className="rounded-xl border bg-card/40 p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>{sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}</div>
}

function Overview() {
  const [o, setO] = useState<ConsoleOverview | null>(null)
  useEffect(() => { api.consoleOverview().then(setO).catch((e) => toast.error(msg(e))) }, [])
  if (!o) return <Loading />
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Accounts" value={fmt(o.users)} sub={`${o.official} official · ${o.suspended} suspended · ${o.new_today} new today`} />
        <Stat label="Runs today" value={fmt(o.today.runs)} sub={`${o.today.active_users} active account${o.today.active_users === 1 ? '' : 's'}`} />
        <Stat label="Billable boxes today" value={fmt(o.today.boxes)} sub={`${fmt(o.week.boxes)} this week`} />
        <Stat label="Charged today" value={usd(o.today.usd)} sub={`${usd(o.week.usd)} this week · ${usd(o.all_time.usd)} all time`} />
      </div>
      <div>
        <h3 className="mb-3 text-sm font-medium">Busiest models this week</h3>
        {o.top_models.length === 0 ? <p className="text-sm text-muted-foreground">No runs yet.</p> : (
          <Table><TableHeader><TableRow><TableHead>Model</TableHead><TableHead className="text-right">Runs</TableHead><TableHead className="text-right">Billable boxes</TableHead><TableHead className="text-right">Charged</TableHead></TableRow></TableHeader>
            <TableBody>{o.top_models.map((m) => <TableRow key={m.model}><TableCell className="font-medium">{m.model}</TableCell><TableCell className="text-right">{fmt(m.runs)}</TableCell><TableCell className="text-right">{fmt(m.boxes)}</TableCell><TableCell className="text-right">{usd(m.usd)}</TableCell></TableRow>)}</TableBody></Table>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Running a model costs <strong className="text-foreground">max({usd(o.settings.price_min)}, {usd(o.settings.price_per_mparam)} × millions of parameters)</strong> per 1M billable boxes. A box is billable above {Math.round(o.settings.billable_conf * 100)}% confidence. Everyone gets {usd(o.settings.daily_free_usd)} free each UTC day. Change these under Pricing.</p>
    </div>
  )
}

function Loading() { return <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading</div> }

function Pill({ on, children, tone }: { on: boolean; children: ReactNode; tone?: 'bad' | 'good' }) {
  return on ? <span className={`rounded-full border px-2 py-0.5 text-[11px] ${tone === 'bad' ? 'border-destructive/50 text-destructive' : tone === 'good' ? 'border-emerald-500/50 text-emerald-400' : 'text-muted-foreground'}`}>{children}</span> : null
}

function Users() {
  const [q, setQ] = useState(''), [rows, setRows] = useState<ConsoleUser[] | null>(null), [total, setTotal] = useState(0), [open, setOpen] = useState<string | null>(null)
  const load = useCallback((text: string) => { api.consoleUsers(text).then((r) => { setRows(r.users); setTotal(r.total) }).catch((e) => toast.error(msg(e))) }, [])
  useEffect(() => { const t = setTimeout(() => load(q), q ? 250 : 0); return () => clearTimeout(t) }, [q, load])
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search accounts" /></div>
      {!rows ? <Loading /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Models</TableHead><TableHead className="text-right">Free</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Daily</TableHead><TableHead className="text-right">Param limit</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id} className="cursor-pointer" onClick={() => setOpen(u.username)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(u.username) }} aria-label={`Open ${u.username}`}>
                <TableCell><div className="flex items-center gap-1.5 font-medium">{u.username}{u.official && <OfficialBadge kind="account" className="size-4" />}</div><div className="text-xs text-muted-foreground">{u.email ?? u.provider ?? ''}</div></TableCell>
                <TableCell className="text-right">{u.models}</TableCell><TableCell className="text-right">{usd(u.free_usd)}</TableCell><TableCell className="text-right">{usd(u.paid_usd)}</TableCell>
                <TableCell className="text-right">{usd(u.daily_usd)}{u.daily_override !== null && <span title="custom" className="text-amber-400"> •</span>}</TableCell>
                <TableCell className="text-right">{u.max_params === null ? '∞' : humanParams(u.max_params)}{u.max_params_override !== null && <span title="custom" className="text-amber-400"> •</span>}</TableCell>
                <TableCell><div className="flex gap-1"><Pill on={u.suspended} tone="bad">suspended</Pill><Pill on={u.unmetered && !u.official}>free runs</Pill></div></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No accounts match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      )}
      <p className="text-xs text-muted-foreground">{total} account{total === 1 ? '' : 's'}{rows && rows.length < total ? `, showing the newest ${rows.length}. Search to narrow down.` : ''}</p>
      <UserDialog username={open} onClose={() => setOpen(null)} onChanged={() => load(q)} />
    </div>
  )
}

function UserDialog({ username, onClose, onChanged }: { username: string | null; onClose: () => void; onChanged: () => void }) {
  const { user: me } = useAuth()
  const [u, setU] = useState<ConsoleUserDetail | null>(null), [busy, setBusy] = useState(false)
  const [amount, setAmount] = useState(''), [note, setNote] = useState(''), [limit, setLimit] = useState(''), [daily, setDaily] = useState('')
  const reload = useCallback(async (name: string) => { try { const d = await api.consoleUser(name); setU(d); setLimit(d.max_params_override === null ? '' : String(d.max_params_override)); setDaily(d.daily_override === null ? '' : String(d.daily_override)) } catch (e) { toast.error(msg(e)) } }, [])
  useEffect(() => { setU(null); setAmount(''); setNote(''); if (username) void reload(username) }, [username, reload])
  const act = async (fn: () => Promise<unknown>, done: string) => { if (!u) return; setBusy(true); try { await fn(); toast.success(done); await reload(u.username); onChanged() } catch (e) { toast.error(msg(e)) } finally { setBusy(false) } }
  const self = !!u && me?.username === u.username
  return (
    <Dialog open={!!username} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{username}{u?.official && <OfficialBadge kind="account" className="size-4" />}</DialogTitle>
          <DialogDescription>{u ? `${u.email ?? u.provider ?? 'No email'} · joined ${ago(u.created_at)}${self ? ' · this is you' : ''}` : 'Loading…'}</DialogDescription>
        </DialogHeader>
        {!u ? <Loading /> : (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Free today" value={usd(u.free_usd)} sub={`of ${usd(u.daily_usd)}`} />
              <Stat label="Paid credits" value={usd(u.paid_usd)} />
              <Stat label="Last 30 days" value={usd(u.usage_30d.usd)} sub={`${fmt(u.usage_30d.runs)} runs · ${fmt(u.usage_30d.boxes)} boxes`} />
            </div>

            <section className="space-y-3">
              <h4 className="font-medium">Credits</h4>
              <form className="flex flex-wrap items-end gap-2" onSubmit={(e: FormEvent) => { e.preventDefault(); const v = parseFloat(amount); if (!Number.isFinite(v) || v === 0) return toast.error('Enter an amount like 10 or -2.50'); void act(() => api.consoleCredits(u.username, v, note), `${v > 0 ? 'Added' : 'Took back'} ${usd(Math.abs(v))}`).then(() => { setAmount(''); setNote('') }) }}>
                <div className="space-y-1"><Label htmlFor="c-amt">Add or take back ($)</Label><Input id="c-amt" inputMode="decimal" className="w-32" placeholder="10" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div className="min-w-40 flex-1 space-y-1"><Label htmlFor="c-note">Note (kept in the audit log)</Label><Input id="c-note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="e.g. beta tester" /></div>
                <Button type="submit" disabled={busy}>Apply</Button>
                <Button type="button" variant="outline" disabled={busy} onClick={() => void act(() => api.consoleRefill(u.username), 'Free credits refilled')}>Refill today’s free credits</Button>
              </form>
            </section>

            <section className="space-y-3">
              <h4 className="font-medium">Limits</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <form className="space-y-1" onSubmit={(e) => { e.preventDefault(); const v = limit.trim() === '' ? null : parseInt(limit.replace(/[_, ]/g, ''), 10); if (v !== null && (!Number.isFinite(v) || v < 1)) return toast.error('Enter a number of parameters, like 60000000'); void act(() => api.consoleEditUser(u.username, { max_params: v }), v === null ? 'Back to the default limit' : `Limit set to ${humanParams(v)} parameters`) }}>
                  <Label htmlFor="l-params">Model size limit (parameters)</Label>
                  <div className="flex gap-2"><Input id="l-params" inputMode="numeric" placeholder={u.official ? 'no limit (official)' : '5000000 (default)'} value={limit} onChange={(e) => setLimit(e.target.value)} /><Button type="submit" variant="outline" disabled={busy}>Set</Button></div>
                  <p className="text-xs text-muted-foreground">Now: {u.max_params === null ? 'no limit' : `${humanParams(u.max_params)} parameters`}{u.max_params_override !== null ? ' (custom)' : ''}. Empty = default.</p>
                </form>
                <form className="space-y-1" onSubmit={(e) => { e.preventDefault(); const v = daily.trim() === '' ? null : parseFloat(daily); if (v !== null && (!Number.isFinite(v) || v < 0)) return toast.error('Enter dollars, like 20'); void act(() => api.consoleEditUser(u.username, { daily_free_usd: v }), v === null ? 'Back to the default daily amount' : `Daily free credits set to ${usd(v)}`) }}>
                  <Label htmlFor="l-daily">Free credits per day ($)</Label>
                  <div className="flex gap-2"><Input id="l-daily" inputMode="decimal" placeholder={`${u.daily_override === null ? u.daily_usd : ''} (default)`} value={daily} onChange={(e) => setDaily(e.target.value)} /><Button type="submit" variant="outline" disabled={busy}>Set</Button></div>
                  <p className="text-xs text-muted-foreground">Now: {usd(u.daily_usd)}{u.daily_override !== null ? ' (custom)' : ''}. Empty = default.</p>
                </form>
              </div>
              <div className="space-y-1">
                <Label htmlFor="l-meter">Billing</Label>
                <select id="l-meter" className="h-9 w-full max-w-xs rounded-md border bg-background px-2 text-sm" value={u.unmetered_override === null ? 'default' : u.unmetered_override ? 'free' : 'metered'} disabled={busy}
                  onChange={(e) => { const v = e.target.value; void act(() => api.consoleEditUser(u.username, { unmetered: v === 'default' ? null : v === 'free' }), 'Billing updated') }}>
                  <option value="default">Default ({u.official ? 'official: runs are free' : 'metered'})</option><option value="metered">Always metered</option><option value="free">Runs are free</option>
                </select>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="font-medium">Account</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant={u.official ? 'outline' : 'default'} disabled={busy || (self && u.official)} title={self && u.official ? 'You can’t remove your own official status' : undefined}
                  onClick={() => { if (u.official && !window.confirm(`Remove official status from ${u.username}?`)) return; void act(() => api.consoleEditUser(u.username, { official: !u.official }), u.official ? 'No longer official' : 'Now an official account') }}>{u.official ? 'Remove official status' : 'Make official'}</Button>
                <Button variant="outline" className={u.suspended ? '' : 'text-destructive'} disabled={busy || u.official || self} title={u.official ? 'Official accounts can’t be suspended' : undefined}
                  onClick={() => { if (!u.suspended && !window.confirm(`Suspend ${u.username}? They are signed out and can’t use affable until you undo it.`)) return; void act(() => api.consoleEditUser(u.username, { suspended: !u.suspended }), u.suspended ? 'Account restored' : 'Account suspended') }}>{u.suspended ? 'Restore account' : 'Suspend account'}</Button>
              </div>
              <p className="text-xs text-muted-foreground">{u.models} model{u.models === 1 ? '' : 's'} · {u.keys} API key{u.keys === 1 ? '' : 's'} · {u.devices} phone{u.devices === 1 ? '' : 's'}{u.phone_2fa ? ' · phone approval on' : ''}</p>
            </section>

            <section className="space-y-2">
              <h4 className="font-medium">Recent activity</h4>
              {u.recent.length === 0 ? <p className="text-muted-foreground">Nothing yet.</p> : (
                <Table><TableHeader><TableRow><TableHead>When</TableHead><TableHead>What</TableHead><TableHead className="text-right">Boxes</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>{u.recent.map((r, i) => <TableRow key={i}><TableCell className="text-muted-foreground">{ago(r.ts)}</TableCell><TableCell>{r.kind === 'run' || r.kind === 'prompt' ? `${r.kind} ${r.model}${r.note ? ` (${r.note})` : ''}` : `${r.kind}${r.note ? `: ${r.note}` : ''}`}</TableCell><TableCell className="text-right">{r.boxes || ''}</TableCell><TableCell className="text-right">{r.kind === 'grant' || r.kind === 'adjust' ? `${r.usd > 0 ? '+' : ''}${usd(r.usd)}` : usd(r.usd)}</TableCell></TableRow>)}</TableBody></Table>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Pricing() {
  const [data, setData] = useState<{ settings: PricingSettings; defaults: PricingSettings; limits: Record<string, [number, number]>; max_params_default: number } | null>(null)
  const [form, setForm] = useState<Record<keyof PricingSettings, string> | null>(null), [busy, setBusy] = useState(false)
  const load = useCallback(async () => { try { const d = await api.consoleSettings(); setData(d); setForm(Object.fromEntries(Object.entries(d.settings).map(([k, v]) => [k, String(v)])) as Record<keyof PricingSettings, string>) } catch (e) { toast.error(msg(e)) } }, [])
  useEffect(() => { void load() }, [load])
  if (!data || !form) return <Loading />
  const num = (k: keyof PricingSettings) => parseFloat(form[k])
  const live: PricingSettings = { price_per_mparam: num('price_per_mparam'), price_min: num('price_min'), billable_conf: num('billable_conf'), daily_free_usd: num('daily_free_usd'), prompt_boxes: num('prompt_boxes') }
  const price = (params: number) => Number.isFinite(live.price_per_mparam) && Number.isFinite(live.price_min) ? Math.max(live.price_min, live.price_per_mparam * params / 1e6) : NaN
  const save = async (e: FormEvent) => {
    e.preventDefault()
    const body: Partial<PricingSettings> = {}
    for (const k of Object.keys(form) as (keyof PricingSettings)[]) { const v = num(k); if (!Number.isFinite(v)) return toast.error('Every field needs a number'); if (v !== data.settings[k]) body[k] = v }
    if (!Object.keys(body).length) return toast('Nothing changed')
    setBusy(true); try { await api.consoleSetSettings(body); toast.success('Pricing saved. It applies to the next run.'); await load() } catch (er) { toast.error(msg(er)) } finally { setBusy(false) }
  }
  const field = (k: keyof PricingSettings, label: string, help: string, step: string) => (
    <div className="space-y-1" key={k}><Label htmlFor={`p-${k}`}>{label}</Label><Input id={`p-${k}`} inputMode="decimal" step={step} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /><p className="text-xs text-muted-foreground">{help} Default {data.defaults[k]}.</p></div>
  )
  return (
    <form onSubmit={save} className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-5">
        {field('price_per_mparam', '$ per 1M boxes, per 1M parameters', 'A model’s price per 1,000,000 billable boxes is this × its size in millions of parameters.', '0.01')}
        {field('price_min', 'Minimum $ per 1M boxes', 'Tiny models never cost less than this.', '0.01')}
        {field('billable_conf', 'Billable confidence (0 to 1)', 'Boxes above this are charged, whatever confidence the caller picks. Lower ones are free.', '0.01')}
        {field('daily_free_usd', 'Free credits per day ($)', 'Everyone’s free bucket refills to this each UTC day. Accounts can have their own amount.', '0.5')}
        {field('prompt_boxes', 'Boxes charged per prompt', 'Promptable (click or box) models are charged this many boxes each time.', '1')}
        <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Save pricing</Button>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-medium">What that charges</h3>
        <Table><TableHeader><TableRow><TableHead>Model size</TableHead><TableHead className="text-right">Per 1M boxes</TableHead><TableHead className="text-right">Per 1,000 boxes</TableHead><TableHead className="text-right">Boxes a day’s free credits cover</TableHead></TableRow></TableHeader>
          <TableBody>{[100_000, 1_000_000, 2_720_000, 5_000_000, 25_000_000, 57_070_000].map((p) => { const x = price(p); return <TableRow key={p}><TableCell>{humanParams(p)} params</TableCell><TableCell className="text-right">{Number.isFinite(x) ? usd(x) : '–'}</TableCell><TableCell className="text-right">{Number.isFinite(x) ? usd(x / 1000) : '–'}</TableCell><TableCell className="text-right">{Number.isFinite(x) && x > 0 ? fmt(Math.floor(live.daily_free_usd / x * 1e6)) : '∞'}</TableCell></TableRow> })}</TableBody></Table>
        <p className="mt-3 text-xs text-muted-foreground">The default model size limit for ordinary accounts is {humanParams(data.max_params_default)} parameters (set on the server). Raise it for one account on its page under Users.</p>
      </div>
    </form>
  )
}

function Audit() {
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  useEffect(() => { api.consoleAudit().then(setRows).catch((e) => toast.error(msg(e))) }, [])
  if (!rows) return <Loading />
  return rows.length === 0 ? <p className="text-sm text-muted-foreground">No changes yet.</p> : (
    <Table><TableHeader><TableRow><TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Account</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((r, i) => <TableRow key={i}><TableCell className="whitespace-nowrap text-muted-foreground">{ago(r.ts)}</TableCell><TableCell>{r.admin}</TableCell><TableCell>{r.action}</TableCell><TableCell>{r.target ?? ''}</TableCell><TableCell className="max-w-md truncate font-mono text-xs text-muted-foreground" title={r.detail ?? ''}>{r.detail}</TableCell></TableRow>)}</TableBody></Table>
  )
}

export default function ConsolePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  if (!user?.official) {
    return <div className="mx-auto max-w-md py-24 text-center"><ShieldCheck className="mx-auto size-8 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">Official accounts only</h1><p className="mt-2 text-sm text-muted-foreground">The console is for the affable team. If you should have access, ask an official account to make yours one.</p></div>
  }
  const tabs: [Tab, string][] = [['overview', 'Overview'], ['users', 'Users'], ['pricing', 'Pricing'], ['audit', 'Audit log']]
  return (
    <div className="space-y-8">
      <div><h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">Console<span className="rounded-full border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">official accounts only</span></h1>
        <p className="mt-1 text-sm text-muted-foreground">Accounts, limits, credits and pricing. Every change is recorded in the audit log.</p></div>
      <div role="tablist" className="flex gap-1 border-b">
        {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === id ? 'border-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
      </div>
      {tab === 'overview' && <Overview />}{tab === 'users' && <Users />}{tab === 'pricing' && <Pricing />}{tab === 'audit' && <Audit />}
    </div>
  )
}
