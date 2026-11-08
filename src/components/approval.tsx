import { useEffect, useRef, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import { Loader2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError, type Challenge, type User } from '@/lib/api'
import { siteOrigin } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** What the phone scans. It carries the request's id and its secret, and where to send the answer. */
export const approvalLink = (c: Challenge) => `affable://approve?c=${encodeURIComponent(c.id)}&s=${encodeURIComponent(c.secret)}&h=${encodeURIComponent(siteOrigin())}`

/** "Approve this on your phone": a QR code to scan with the Discovery app, and a way in with a recovery code if the phone is lost. */
export function ApprovalPanel({ challenge, signingIn, onDone, onCancel }: { challenge: Challenge; signingIn?: string; onDone: (u: User) => void; onCancel: () => void }) {
  const [qr, setQr] = useState<string | null>(null)
  const [left, setLeft] = useState(challenge.expires_in)
  const [code, setCode] = useState(''), [useCode, setUseCode] = useState(false), [busy, setBusy] = useState(false)
  const done = useRef(false)
  const link = approvalLink(challenge)

  useEffect(() => { QRCode.toDataURL(link, { width: 232, margin: 1, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(null)) }, [link])
  useEffect(() => {
    done.current = false
    const tick = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000)
    const poll = setInterval(async () => {
      if (done.current) return
      try { const u = await api.claim(challenge); if (u && !done.current) { done.current = true; onDone(u) } }
      catch (e) { if (!done.current) { done.current = true; toast.error(e instanceof ApiError ? e.message : 'The sign-in stopped'); onCancel() } }
    }, 2000)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [challenge]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (left === 0 && !done.current) { done.current = true; toast.error('That sign-in request ran out of time. Please try again.'); onCancel() } }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  async function recover(e: FormEvent) {
    e.preventDefault(); setBusy(true)
    try { await api.recover(challenge, code); toast.success('Recovery code accepted') } catch (err) { toast.error(err instanceof ApiError ? err.message : 'Something went wrong') } finally { setBusy(false) }
  }
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12" data-approval-link={link}>
      <div className="grid size-11 place-items-center rounded-xl border bg-card"><Smartphone className="size-5" /></div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Approve on your phone</h1>
      <p className="mt-2 text-sm text-muted-foreground">{signingIn ? `Signing in as ${signingIn}. ` : ''}Open <strong className="text-foreground">Discovery</strong> on your iPhone, tap <strong className="text-foreground">Scan</strong>, and point it at this code.</p>
      <div className="mt-6 grid place-items-center rounded-xl border bg-white p-3">{qr ? <img src={qr} alt="Code to scan with the Discovery app" className="size-56" /> : <Loader2 className="my-24 animate-spin text-black/50" />}</div>
      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Waiting for approval · {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</p>
      {useCode ? (
        <form onSubmit={recover} className="mt-6 space-y-3">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Recovery code, like ABCDE-FGHJK" className="h-10 font-mono" autoFocus spellCheck={false} autoComplete="one-time-code" />
          <Button type="submit" className="h-10 w-full" disabled={busy || code.trim().length < 8}>{busy && <Loader2 className="animate-spin" />}Use recovery code</Button>
        </form>
      ) : <button className="mt-6 text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => setUseCode(true)}>Lost your phone? Use a recovery code</button>}
      <Button variant="ghost" className="mt-2" onClick={onCancel}>Cancel</Button>
    </div>
  )
}
