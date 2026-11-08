import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Apple, ArrowRight, Check, Cloud, HardDrive, Keyboard, Library, Monitor, UserRound } from 'lucide-react'
import { studioRelease, type StudioFile, type StudioRelease } from '@/lib/api'
import { apiUrl } from '@/lib/config'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'

const FORMATS = ['COCO', 'YOLO', 'Pascal VOC', 'LabelMe', 'Create ML', 'CSV']
const mb = (n: number) => `${Math.round(n / 1e6)} MB`

function Shot({ src, alt }: { src: string; alt: string }) {
  return <div className="overflow-hidden rounded-xl border bg-card shadow-2xl"><img src={src} alt={alt} className="block w-full" /></div>
}
function Feature({ icon, title, children, shot, alt, flip }: { icon: React.ReactNode; title: string; children: React.ReactNode; shot: string; alt: string; flip?: boolean }) {
  return (
    <section className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16">
      <div className={flip ? 'lg:order-2' : ''}>
        <div className="grid size-10 place-items-center rounded-lg border bg-card [&_svg]:size-5">{icon}</div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <div className="mt-3 space-y-3 text-muted-foreground">{children}</div>
      </div>
      <div className={flip ? 'lg:order-1' : ''}><Shot src={shot} alt={alt} /></div>
    </section>
  )
}

export default function Studio() {
  const [rel, setRel] = useState<StudioRelease | null | undefined>(undefined)
  useEffect(() => { studioRelease().then(setRel).catch(() => setRel(null)) }, [])
  const onWindows = typeof navigator !== 'undefined' && /Windows/.test(navigator.userAgent)
  const [os, setOs] = useState<'mac' | 'win'>(onWindows ? 'win' : 'mac')
  const files: Record<'mac' | 'win', StudioFile | null | undefined> = { mac: rel === undefined ? undefined : rel?.mac ?? null, win: rel === undefined ? undefined : rel?.windows ?? null }
  const order: ('mac' | 'win')[] = onWindows ? ['win', 'mac'] : ['mac', 'win']
  const label = { mac: 'Download for Mac', win: 'Download for Windows' }
  const icon = { mac: <Apple />, win: <Monitor /> }

  const DownloadBtn = ({ className = '' }: { className?: string }) => (
    <>
      {order.map((k, i) => {
        const f = files[k]
        return f
          ? <Button key={k} asChild size="lg" variant={i === 0 ? 'default' : 'outline'} className={`h-12 gap-2 px-6 text-base ${className}`}><a href={apiUrl(f.path)} download>{icon[k]}{label[k]}</a></Button>
          : <Button key={k} size="lg" variant={i === 0 ? 'default' : 'outline'} disabled className={`h-12 gap-2 px-6 text-base ${className}`}>{icon[k]}{f === undefined ? 'Checking…' : `${k === 'mac' ? 'Mac' : 'Windows'} coming soon`}</Button>
      })}
    </>
  )
  const meta = (k: 'mac' | 'win') => { const f = files[k]; return f ? `${k === 'mac' ? 'macOS, Apple silicon' : 'Windows 10/11, 64-bit'} · v${f.version} · ${mb(f.size)}` : k === 'mac' ? 'macOS, Apple silicon' : 'Windows 10/11, 64-bit' }

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
          <img src="/wordmark.svg" alt="affable" className="mx-auto h-7 w-auto opacity-70" />
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Annotation, redefined.</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-balance text-muted-foreground">A model does the first pass. You review. affable studio turns a folder of images into labeled data in a fraction of the time.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <DownloadBtn />
          </div>
          <div className="mt-3 flex justify-center">
            <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground"><Link to="/newsroom/affable-studio">Read the announcement<ArrowRight /></Link></Button>
          </div>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">{order.map((k) => <span key={k} className="flex items-center gap-1.5 [&_svg]:size-4">{icon[k]}{meta(k)}</span>)}</p>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Shot src="/img/studio/app.webp" alt="affable studio with AI suggestions on a photo of a living room" />

          <Feature icon={<Cloud />} title="Start from a draft, not a blank image" shot="/img/studio/draft.webp" alt="Nine AI suggestions with confidence scores on a bedroom photo">
            <p>Pick a model and it proposes the boxes, each with a confidence score. Run it on one image, or on the whole folder.</p>
            <p className="flex items-start gap-2"><Cloud className="mt-1 size-4 shrink-0" /><span><strong className="text-foreground">Cloud</strong> runs the model on affable, so any laptop will do.</span></p>
            <p className="flex items-start gap-2"><HardDrive className="mt-1 size-4 shrink-0" /><span><strong className="text-foreground">Offline</strong> runs a downloaded copy on your machine. No internet, and nothing leaves your computer.</span></p>
          </Feature>

          <Feature flip icon={<Keyboard />} title="Review at the speed of a keystroke" shot="/img/studio/review.webp" alt="Accepted boxes and the class list in affable studio">
            <p>Accept with <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Enter</kbd>, reject with <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">X</kbd>, or accept everything on an image at once. Drag to fix a box. Double-click a label to rename it or give it another class.</p>
            <p>Your images are never modified, and your work autosaves next to them.</p>
          </Feature>

          <section className="border-y py-14 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your labels, in any format</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Import what you already have. Export what your training code expects.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">{FORMATS.map((f) => <span key={f} className="rounded-full border bg-card px-4 py-1.5 text-sm">{f}</span>)}</div>
          </section>

          <Feature icon={<Library />} title="Every model on affable, one click away" shot="/img/studio/models.webp" alt="A model's README and details inside affable studio">
            <p>Browse public models, read their README and details without leaving the app, and add the ones you like to your library. If a model has open weights, download it to use offline.</p>
          </Feature>

          <Feature flip icon={<UserRound />} title="Sign in, and it follows you" shot="/img/studio/signin.webp" alt="The sign-in window in affable studio">
            <p>Sign in with your affable account to use your private models. Your studio preferences are saved to your account, so a new machine feels like your old one.</p>
          </Feature>
        </div>

        <section className="border-t bg-card/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Get affable studio</h2>
              <div className="mt-6 flex flex-wrap gap-3"><DownloadBtn /></div>
              {(['mac', 'win'] as const).map((k) => files[k]?.sha256 && <p key={k} className="mt-4 text-xs text-muted-foreground">{k === 'mac' ? 'Mac' : 'Windows'} SHA-256 <span className="font-mono break-all">{files[k]!.sha256}</span></p>)}
            </div>
            <div>
              <div className="mb-4 inline-flex rounded-lg border p-1 text-sm" role="tablist" aria-label="Install steps for">
                {(['mac', 'win'] as const).map((k) => <button key={k} role="tab" aria-selected={os === k} onClick={() => setOs(k)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 [&_svg]:size-4 ${os === k ? 'bg-secondary font-medium' : 'text-muted-foreground'}`}>{icon[k]}{k === 'mac' ? 'Mac' : 'Windows'}</button>)}
              </div>
              <ol className="space-y-4 text-sm">
                {(os === 'mac' ? [
                  ['Open the .dmg', 'and drag affable studio into Applications.'],
                  ['The first time, right-click it and choose Open.', 'affable studio isn’t notarized by Apple yet, so macOS asks you to confirm once.'],
                  ['Pick a model and open a folder.', 'That’s it. Add an account later if you want your private models.'],
                ] : [
                  ['Run the installer', '(affable-studio-Setup-….exe). Pick where to install, or just click Install. It installs for you only, so no admin password is needed.'],
                  ['If Windows says “Windows protected your PC”,', 'choose More info, then Run anyway. affable studio isn’t code-signed yet, so Windows asks you to confirm once.'],
                  ['Pick a model and open a folder.', 'That’s it. Add an account later if you want your private models.'],
                ]).map(([t, d], i) => (
                  <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs">{i + 1}</span><span><strong>{t}</strong> <span className="text-muted-foreground">{d}</span></span></li>
                ))}
                <li className="flex gap-3 pt-2 text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0" />{os === 'mac' ? 'Needs a Mac with Apple silicon (M1 or newer). Intel Macs aren’t supported yet.' : 'Needs Windows 10 or 11, 64-bit (Intel or AMD). Offline models run on the CPU.'}</li>
                <li className="flex gap-3 text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0" />After this, affable studio keeps itself up to date. It checks for new versions and installs them when you choose, under Preferences, Updates. Rarely, an update is required (a security fix, say) and has to be installed before you can keep using it.</li>
              </ol>
            </div>
          </div>
        </section>
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Minimum requirements</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">affable studio runs on your own machine. Cloud models need an internet connection; offline models and your labels don’t.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {([
                ['mac', 'Mac', icon.mac, [
                  ['System', 'macOS 13 (Ventura) or newer'],
                  ['Processor', 'Apple silicon (M1 or newer). Intel Macs aren’t supported yet'],
                  ['Memory', '4 GB (8 GB or more recommended for large offline models)'],
                  ['Disk space', '1 GB free: about 350 MB for the app, plus room for models you download'],
                  ['Display', '1280 × 720 or larger'],
                ]],
                ['win', 'Windows', icon.win, [
                  ['System', 'Windows 10 or Windows 11, 64-bit'],
                  ['Processor', '64-bit Intel or AMD. Offline models run on the CPU'],
                  ['Memory', '4 GB (8 GB or more recommended for large offline models)'],
                  ['Disk space', '1 GB free: about 430 MB for the app, plus room for models you download'],
                  ['Display', '1280 × 720 or larger'],
                ]],
              ] as const).map(([k, name, ic, rows]) => (
                <div key={k} className="rounded-xl border bg-card/40 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold [&_svg]:size-5">{ic}{name}</h3>
                  <dl className="mt-4 divide-y text-sm">
                    {rows.map(([t, d]) => <div key={t} className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5"><dt className="text-muted-foreground">{t}</dt><dd>{d}</dd></div>)}
                  </dl>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">An internet connection is needed to sign in, to run cloud models, to browse and download models, and to update. Everything else works offline.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
