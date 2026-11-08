import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Apple, ArrowRight, Check, Cloud, Download, HardDrive, Keyboard, Library, UserRound } from 'lucide-react'
import { studioRelease, type StudioRelease } from '@/lib/api'
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
  const dl = rel ? apiUrl(rel.path) : undefined

  const DownloadBtn = ({ className = '' }: { className?: string }) => dl
    ? <Button asChild size="lg" className={`h-12 gap-2 px-6 text-base ${className}`}><a href={dl} download><Download />Download for Mac</a></Button>
    : <Button size="lg" disabled className={`h-12 px-6 text-base ${className}`}>{rel === undefined ? 'Checking…' : 'Download unavailable right now'}</Button>

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
            <Button asChild variant="outline" size="lg" className="h-12 gap-2 px-6 text-base"><Link to="/newsroom/affable-studio">Read the announcement<ArrowRight /></Link></Button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Apple className="size-4" />macOS, Apple silicon{rel ? ` · v${rel.version} · ${mb(rel.size)}` : ''}</p>
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
              <div className="mt-6"><DownloadBtn /></div>
              {rel?.sha256 && <p className="mt-4 text-xs text-muted-foreground">SHA-256 <span className="font-mono break-all">{rel.sha256}</span></p>}
            </div>
            <ol className="space-y-4 text-sm">
              {[
                ['Open the .dmg', 'and drag affable studio into Applications.'],
                ['The first time, right-click it and choose Open.', 'affable studio isn’t notarized by Apple yet, so macOS asks you to confirm once.'],
                ['Pick a model and open a folder.', 'That’s it. Add an account later if you want your private models.'],
              ].map(([t, d], i) => (
                <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs">{i + 1}</span><span><strong>{t}</strong> <span className="text-muted-foreground">{d}</span></span></li>
              ))}
              <li className="flex gap-3 pt-2 text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0" />Mac with Apple silicon only for now.</li>
              <li className="flex gap-3 text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0" />After this, affable studio updates itself: Preferences, Updates.</li>
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
