import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { SecurityCard } from '@/components/security-card'
import { CreditsCard } from '@/components/credits-card'
import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

/** Centre-crop to a square and shrink, so uploads stay tiny whatever the photo size. */
async function toSquareBlob(file: File, size = 256): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Could not read that image')); img.src = url })
    const s = Math.min(img.width, img.height)
    const c = document.createElement('canvas'); c.width = c.height = size
    c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not process that image'))), 'image/webp', 0.9))
  } finally { URL.revokeObjectURL(url) }
}

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong')

function Section({ title, desc, children, danger }: { title: string; desc?: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={`grid gap-6 border-t py-8 md:grid-cols-[16rem_minmax(0,1fr)] ${danger ? 'border-destructive/30' : ''}`}>
      <div><h2 className="font-medium">{title}</h2>{desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}</div>
      <div className="max-w-md space-y-4">{children}</div>
    </section>
  )
}

function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} {...props} /></div>
}

export default function SettingsPage() {
  const { user, setUser } = useAuth()
  const nav = useNavigate()
  const u = user!
  const [name, setName] = useState(u.name ?? '')
  const [email, setEmail] = useState(u.email ?? '')
  const [bio, setBio] = useState(u.bio ?? '')
  const [website, setWebsite] = useState(u.website ?? '')
  const [picBusy, setPicBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [delPw, setDelPw] = useState('')
  const [delBusy, setDelBusy] = useState(false)

  const dirty = name !== (u.name ?? '') || email !== (u.email ?? '') || bio !== (u.bio ?? '') || website !== (u.website ?? '')
  const hasUpload = !!u.avatar?.startsWith('/api/users/')

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    try { setUser(await api.updateMe({ name, email, bio, website })); toast.success('Profile saved') } catch (err) { toast.error(msg(err)) } finally { setSaving(false) }
  }
  async function pickPicture(file: File | undefined) {
    if (!file) return
    setPicBusy(true)
    try { setUser(await api.uploadAvatar(await toSquareBlob(file))); toast.success('Picture updated') } catch (err) { toast.error(msg(err)) } finally { setPicBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  async function removePicture() {
    setPicBusy(true)
    try { setUser(await api.deleteAvatar()); toast.success('Picture removed') } catch (err) { toast.error(msg(err)) } finally { setPicBusy(false) }
  }
  async function savePassword(e: FormEvent) {
    e.preventDefault()
    if (pw !== pw2) return toast.error("New passwords don't match")
    setPwBusy(true)
    try {
      await api.changePassword(u.has_password ? cur : undefined, pw)
      setCur(''); setPw(''); setPw2('')
      setUser({ ...u, has_password: true })
      toast.success(u.has_password ? 'Password changed. Other devices were signed out.' : 'Password set')
    } catch (err) { toast.error(msg(err)) } finally { setPwBusy(false) }
  }
  async function del() {
    setDelBusy(true)
    try { await api.deleteAccount(confirm, u.has_password ? delPw : undefined); setUser(null); nav('/') } catch (err) { toast.error(msg(err)); setDelBusy(false) }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Signed in as <span className="text-foreground">{u.username}</span>{u.provider && u.provider !== 'password' ? ` via ${u.provider}` : ''}</p>

      <div className="mt-8">
        <Section title="Profile" desc="Shown on your public profile. Your username is part of every model's address, so it can't be changed.">
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar username={u.username} src={u.avatar} className="size-20" />
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pickPicture(e.target.files?.[0])} />
                  <Button type="button" variant="outline" size="sm" disabled={picBusy} onClick={() => fileRef.current?.click()}>{picBusy && <Loader2 className="animate-spin" />}Upload</Button>
                  {hasUpload && <Button type="button" variant="ghost" size="sm" disabled={picBusy} onClick={removePicture}>Remove</Button>}
                </div>
              </div>
            </div>
            <Field id="username" label="Username" value={u.username} disabled readOnly />
            <Field id="name" label="Display name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            <Field id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field id="bio" label="Bio" value={bio} maxLength={200} placeholder="A line about you or your org" onChange={(e) => setBio(e.target.value)} />
            <Field id="website" label="Website" type="url" value={website} placeholder="https://" onChange={(e) => setWebsite(e.target.value)} />
            <Button type="submit" disabled={!dirty || saving}>{saving && <Loader2 className="animate-spin" />}Save changes</Button>
          </form>
        </Section>

        <Section title={u.has_password ? 'Password' : 'Set a password'} desc={u.has_password ? 'Changing it signs out every other device.' : 'You signed up with a provider. Add a password to also log in with email.'}>
          <form onSubmit={savePassword} className="space-y-4">
            {u.has_password && <Field id="cur" label="Current password" type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} />}
            <Field id="pw" label="New password" type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
            <Field id="pw2" label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required value={pw2} onChange={(e) => setPw2(e.target.value)} />
            <Button type="submit" disabled={pwBusy}>{pwBusy && <Loader2 className="animate-spin" />}{u.has_password ? 'Change password' : 'Set password'}</Button>
          </form>
        </Section>

        <Section title="Credits" desc="What running cloud models costs, and what you have left."><CreditsCard /></Section>
        <Section title="Phone approval" desc="Make your iPhone approve every sign-in, with the Discovery app.">{u.official || u.phone_2fa ? <SecurityCard /> : <p className="text-sm text-muted-foreground">Phone approval is only available to official accounts for now.</p>}</Section>
        <Section title="Sessions" desc="Sign out everywhere except this browser.">
          <Button variant="outline" onClick={async () => { const r = await api.logoutOthers(); toast.success(r.signed_out ? `Signed out ${r.signed_out} other session(s)` : 'No other sessions') }}>Sign out other devices</Button>
        </Section>

        <Section title="Delete account" desc="Permanently deletes your account, API keys, models and all stored weights." danger>
          <Dialog onOpenChange={(o) => { if (!o) { setConfirm(''); setDelPw('') } }}>
            <DialogTrigger asChild><Button variant="destructive">Delete account</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Delete your account?</DialogTitle><DialogDescription>This can't be undone. Every model you've pushed will be removed from the server.</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <Field id="confirm" label={`Type "${u.username}" to confirm`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
                {u.has_password && <Field id="delpw" label="Password" type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} autoComplete="current-password" />}
              </div>
              <DialogFooter><Button variant="destructive" disabled={confirm.toLowerCase() !== u.username.toLowerCase() || (u.has_password && !delPw) || delBusy} onClick={del}>{delBusy && <Loader2 className="animate-spin" />}Delete forever</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>
      </div>
    </div>
  )
}
