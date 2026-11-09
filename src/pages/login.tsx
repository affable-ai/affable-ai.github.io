import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Shuffle } from 'lucide-react'
import { randomUsername } from '@/lib/names'
import { API_BASE, STANDALONE } from '@/lib/config'
import { api, ApiError, type Challenge } from '@/lib/api'
import { ApprovalPanel } from '@/components/approval'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { InkArt } from '@/components/ink-art'

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.55c2.08-1.91 3.24-4.74 3.24-8.09Z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.75c-.98.66-2.24 1.06-3.73 1.06-2.87 0-5.3-1.94-6.17-4.55H2.16v2.84A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.83 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.16a11 11 0 0 0 0 9.88l3.67-2.84Z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.16 7.06l3.67 2.84C6.7 7.32 9.13 5.38 12 5.38Z" /></svg>
)

const ERRORS: Record<string, string> = {
  oauth_state: 'That sign-in attempt expired. Please try again.',
  oauth_failed: "The provider didn't complete sign-in. Please try again.",
}

export default function Login() {
  const { user, loading, setUser } = useAuth()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'in' | 'up'>(params.get('mode') === 'signup' ? 'up' : 'in')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState(randomUsername)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [oauth, setOauth] = useState<string[]>([])
  const [approval, setApproval] = useState<{ ch: Challenge; as?: string } | null>(null)   // waiting for the phone

  useEffect(() => { api.providers().then((p) => setOauth(p.oauth)).catch(() => {}) }, [])
  // coming back from GitHub or Google with phone approval on: the secret is in the URL fragment
  useEffect(() => { const id = params.get('approve'), s = new URLSearchParams(window.location.hash.slice(1)).get('s'); if (id && s) { setApproval({ ch: { id, secret: s, expires_in: 180 } }); history.replaceState(null, '', window.location.pathname) } }, [params])
  useEffect(() => { const e = params.get('error'); if (e) toast.error(ERRORS[e] ?? 'Sign-in failed') }, [params])

  const next = params.get('next'), after = next && /^\/[A-Za-z0-9/_?=&.%-]*$/.test(next) && !next.startsWith('//') ? next : '/dashboard'   // where to go once signed in (only a path on this site)
  if (!loading && user) return <Navigate to={after} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const r = mode === 'in' ? await api.login(email, password) : await api.register(email, password, username)
      if ('approval' in r) setApproval({ ch: r.approval, as: email.includes('@') ? email : undefined }); else setUser(r)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally { setBusy(false) }
  }

  async function phoneSignIn() {
    setBusy(true)
    try { setApproval({ ch: await api.qrStart() }) } catch (err) { toast.error(err instanceof ApiError ? err.message : 'Something went wrong') } finally { setBusy(false) }
  }

  const provider = (name: 'github' | 'google', label: string, icon: React.ReactNode) => {
    const on = oauth.includes(name)
    return (
      <Button
        type="button" variant="outline" className="h-10 w-full justify-center gap-2"
        disabled={!on} title={on ? undefined : `${label} sign-in isn't configured on this server yet`}
        onClick={() => { window.location.href = `${API_BASE}/api/auth/oauth/${name}/start` + (STANDALONE ? `?ret=${encodeURIComponent(window.location.origin)}` : '') }}
      >
        {icon}{label}
      </Button>
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(420px,5fr)_6fr]">
      {/* ------------- auth ------------- */}
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Link to="/" className="flex items-center gap-2 self-start">
          <img src="/wordmark.svg" alt="affable" className="h-7 w-auto" />
        </Link>

        {approval ? <ApprovalPanel challenge={approval.ch} signingIn={approval.as} onDone={(u) => { setApproval(null); setUser(u) }} onCancel={() => setApproval(null)} /> : (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-semibold tracking-tight">
            {mode === 'in' ? 'Welcome back' : 'Create your account'}
          </h1>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {provider('github', 'GitHub', <GithubIcon />)}
            {provider('google', 'Google', <GoogleIcon />)}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" />or with email<Separator className="flex-1" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{mode === 'in' ? 'Email or username' : 'Email'}</Label>
              <Input id="email" type={mode === 'in' ? 'text' : 'email'} autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
            </div>
            {mode === 'up' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2">
                  <Input id="username" autoComplete="off" spellCheck={false} placeholder="Leave blank for a random one" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10" />
                  <Button type="button" variant="outline" size="icon" className="size-10 shrink-0" aria-label="Suggest another username" onClick={() => setUsername(randomUsername())}><Shuffle /></Button>
                </div>
                <p className="text-xs text-muted-foreground">Public, and part of your model addresses (<span className="font-mono">{username || 'username'}/model</span>). It can't be changed later.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={mode === 'up' ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
              {mode === 'up' && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
            </div>
            <Button type="submit" className="h-10 w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}{mode === 'in' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'in' ? "New to affable?" : 'Already have an account?'}{' '}
            <button className="font-medium text-foreground underline underline-offset-4" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
              {mode === 'in' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          {mode === 'in' && <button type="button" className="mt-3 text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={phoneSignIn} disabled={busy}>Sign in with your phone instead</button>}
        </div>)}
      </div>

      {/* ------------- art ------------- */}
      <div className="relative hidden overflow-hidden lg:block">
        <InkArt seed="affable-login-v1" variant="hero" animate className="absolute inset-0 size-full" />
      </div>
    </div>
  )
}
