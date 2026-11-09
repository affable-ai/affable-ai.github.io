import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteOrigin } from '@/lib/config'
import { ArrowRight, GitBranch, Globe, HardDrive, Lock, PenLine, Play, Zap } from 'lucide-react'
import { api, type Model } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ModelCard } from '@/components/model-card'
import { Button } from '@/components/ui/button'
import { InkArt } from '@/components/ink-art'
import { CopyCode } from '@/components/copy-code'
import { SiteFooter, SiteHeader } from '@/components/site-header'

type Seg = { t: string; c?: string }
const dim = 'text-muted-foreground', ok = 'text-emerald-400'
const LINES: Seg[][] = [
  [{ t: '$ ', c: dim }, { t: 'pip install affable' }],
  [{ t: '$ ', c: dim }, { t: 'affable push ./my-detector --public' }],
  [{ t: '✓ ', c: ok }, { t: 'Pushed ' }, { t: 'you/my-detector', c: 'font-semibold' }, { t: '  v1 · 2.1M params', c: dim }],
  [{ t: '  Live: API, playground, CLI', c: dim }],
  [{ t: '$ ', c: dim }, { t: 'affable run you/my-detector street.jpg' }],
  [{ t: 'car      0.91   ' }, { t: '[120, 88, 392, 301]', c: dim }],
  [{ t: 'person   0.84   ' }, { t: '[402, 70, 468, 262]', c: dim }],
]
const TOTAL = LINES.flat().reduce((n, s) => n + s.t.length, 0)

const steps = [
  { n: '01', title: 'Push your model', body: 'Upload an ONNX file from your terminal. affable counts the parameters, versions it and stores it.', code: '$ affable push ./my-detector --public' },
  { n: '02', title: 'It gets an API', body: 'Every model comes with an HTTP endpoint, a Python client and a playground in the browser.', code: 'POST /api/models/you/my-detector/run' },
  { n: '03', title: 'Call it from anywhere', body: 'Send an image, get boxes back. There are no servers for you to run or scale.', code: 'result = affable.run("you/my-detector", "street.jpg")' },
]
const features = [
  { icon: Zap, title: 'An API for every model', body: 'Each model is served behind an HTTP API, with a Python client and a CLI.' },
  { icon: Play, title: 'Browser playground', body: 'Try any model without installing anything. Drop in an image and see the boxes.' },
  { icon: GitBranch, title: 'Versioned deploys', body: 'Every push is a numbered version with a message, a parameter count and a file list.' },
  { icon: Globe, title: 'Private or public', body: 'Keep a model to yourself, or list it on Explore so anyone can run it.' },
  { icon: Lock, title: 'Open or closed weights', body: 'Let people download your weights, or let them only run the model on affable.' },
  { icon: HardDrive, title: 'Run it offline', body: 'Open-weights models can be downloaded and run on your own machine, with no connection.' },
]

const SAMPLE = [['television set', '0.70', '[6, 166, 154, 271]'], ['basket', '0.46', '[605, 293, 640, 357]'], ['vase', '0.40', '[550, 307, 585, 400]']]
type Tab = 'python' | 'curl' | 'cli'

/** The hero's call to a real hosted model, in the three ways you can make it. */
function HeroCode() {
  const [tab, setTab] = useState<Tab>('python')
  const origin = typeof window !== 'undefined' ? siteOrigin() : ''
  const code: Record<Tab, string> = {
    python: 'import affable\n\nresult = affable.run("affable/extra-a", "photo.jpg")\nfor d in result["detections"]:\n    print(d["label"], d["score"], d["box"])',
    curl: `$ curl -X POST "${origin}/api/models/affable/extra-a/run" \\\n    -H "Authorization: Bearer $AFFABLE_API_KEY" \\\n    --data-binary @photo.jpg`,
    cli: '$ affable run affable/extra-a photo.jpg',
  }
  const t = (id: Tab, label: string) => <button onClick={() => setTab(id)} className={`-mb-px border-b-2 px-4 py-2.5 text-sm ${tab === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>
  return (
    <div className="overflow-hidden rounded-xl border bg-card/60">
      <div className="flex items-center border-b px-2">{t('python', 'Python')}{t('curl', 'cURL')}{t('cli', 'CLI')}<span className="ml-auto pr-3 font-mono text-xs text-muted-foreground">affable/extra-a</span></div>
      <CopyCode className="rounded-none border-0">{code[tab]}</CopyCode>
      <div className="border-t px-5 py-4">
        <div className="mb-2 text-xs text-muted-foreground">Response</div>
        <div className="space-y-1 font-mono text-[13px]">{SAMPLE.map(([l, s, b]) => <div key={l} className="flex gap-4"><span className="w-28 shrink-0">{l}</span><span className="w-10 text-emerald-400">{s}</span><span className="text-muted-foreground">{b}</span></div>)}</div>
      </div>
    </div>
  )
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => t * t * (3 - 2 * t)

function Terminal({ chars }: { chars: number }) {
  let left = chars
  return (
    <pre className="min-h-[13.5rem] overflow-hidden p-5 font-mono text-[13px] leading-7 sm:text-sm">
      {LINES.map((line, i) => {
        const segs = line.map((s, j) => {
          const n = clamp(left, 0, s.t.length); left -= n
          return n > 0 ? <span key={j} className={s.c}>{s.t.slice(0, n)}</span> : null
        })
        return <div key={i}>{segs}{'\u200b'}</div>
      })}
      <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-foreground/80" />
    </pre>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [featured, setFeatured] = useState<Model[]>([])
  useEffect(() => { api.discover('', 3).then(setFeatured).catch(() => {}) }, [])

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const track = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const cta = useRef<HTMLDivElement>(null)
  const [chars, setChars] = useState(reduced ? TOTAL : 0)

  // Scrolling drives the DOM directly (clip-path + transform + opacity): no React render per scroll event.
  useLayoutEffect(() => {
    if (reduced) return
    let raf = 0, lastChars = -1
    const update = () => {
      raf = 0
      const el = track.current, f = frame.current, c = card.current, k = cta.current
      if (!el || !f || !c || !k) return
      const vh = window.innerHeight, vw = window.innerWidth
      const p = clamp(-el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - vh))
      // 0 -> .4 the card grows to fill the screen | .3 -> .85 commands type out | .9 -> 1 call to action
      const grow = ease(clamp(p / 0.4))
      const typed = ease(clamp((p - 0.3) / 0.55))
      const show = ease(clamp((p - 0.9) / 0.1))
      const boxH = Math.min(440, vh * 0.6)
      const insetY = ((vh - boxH) / 2) * (1 - grow)
      const insetX = Math.max(16, (vw - 1152) / 2) * (1 - grow)
      f.style.clipPath = `inset(${insetY.toFixed(1)}px ${insetX.toFixed(1)}px round ${(14 * (1 - grow)).toFixed(1)}px)`
      c.style.transform = `scale(${lerp(1, vw < 640 ? 0.97 : 1.3, grow).toFixed(3)})`
      k.style.opacity = String(show)
      k.style.transform = `translateY(${((1 - show) * 16).toFixed(1)}px)`
      k.style.pointerEvents = show > 0.5 ? 'auto' : 'none'
      const n = Math.round(typed * TOTAL)
      if (n !== lastChars) { lastChars = n; setChars(n) }
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf) }
  }, [reduced])

  const startHref = user ? '/dashboard' : '/login?mode=signup'
  const startLabel = user ? 'Open dashboard' : 'Get started'

  return (
    <div className="bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-20 pb-20 sm:px-6 sm:pt-28 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">Deploy models.<br />Get an API.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Push an ONNX model from your terminal. affable hosts it, versions it and serves it behind a simple API, with a playground to try it in the browser.</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base"><Link to={startHref}>{startLabel}<ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base"><Link to="/docs">Read the docs</Link></Button>
          </div>
        </div>
        <HeroCode />
      </section>

      {/* scroll stage: a sticky full-viewport window inside a tall track */}
      <div ref={track} style={{ height: reduced ? 'auto' : '300svh' }} className="relative">
        <div className={reduced ? 'relative mx-auto h-[28rem] max-w-6xl overflow-hidden px-4' : 'sticky top-0 h-svh overflow-hidden'}>
          <div ref={frame} className="absolute inset-0 bg-background" style={reduced ? undefined : { clipPath: 'inset(20% 5% round 14px)' }}>
            <InkArt seed="affable-home-v1" variant="hero" className="absolute inset-0 size-full opacity-80" />
            <div className="absolute inset-0 grid place-items-center px-4">
              <div ref={card} className="w-full max-w-xl origin-center overflow-hidden rounded-xl border bg-background/95 shadow-2xl will-change-transform">
                <div className="flex items-center gap-1.5 border-b px-4 py-3">
                  {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-muted-foreground/30" />)}
                </div>
                <Terminal chars={chars} />
              </div>
            </div>
            <div ref={cta} className="absolute inset-x-0 bottom-[12%] flex justify-center" style={reduced ? undefined : { opacity: 0 }}>
              <Button asChild size="lg"><Link to={startHref}>{startLabel}<ArrowRight /></Link></Button>
            </div>
          </div>
        </div>
      </div>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="mb-8 flex items-end justify-between"><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Run what people have published</h2><Link to="/discover" className="text-muted-foreground hover:text-foreground">View all <ArrowRight className="inline size-4" /></Link></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map((m) => <ModelCard key={m.slug} m={m} />)}</div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">From weights to an API in three steps</h2>
        <div className="mt-10 grid grid-cols-1 border md:grid-cols-3 md:divide-x">
          {steps.map((s) => (
            <div key={s.n} className="min-w-0 space-y-4 border-b p-6 last:border-b-0 md:border-b-0">
              <div className="font-mono text-sm text-muted-foreground">{s.n}</div>
              <h3 className="text-xl font-medium">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
              <CopyCode wrap>{s.code}</CopyCode>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Everything you need to ship a model</h2>
        <p className="mt-2 text-muted-foreground">Today affable runs ONNX object-detection models up to 5M parameters.</p>
        <div className="mt-10 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-background p-7">
              <Icon className="size-6" />
              <h3 className="mt-5 text-lg font-medium">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid items-center gap-8 border p-8 sm:p-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><PenLine className="size-4" />affable studio</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Label data with your own models</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">A desktop app for annotating images. Models you host, or ones you download and run offline, suggest the boxes, and you review them. Import and export COCO, YOLO, Pascal VOC and more.</p>
          </div>
          <ul className="space-y-2.5 text-[15px] text-muted-foreground">
            {['Cloud and offline AI assist', 'Accept, fix or reject suggestions', 'Auto-label a whole folder', 'Works with your private models'].map((x) => <li key={x} className="flex items-center gap-2.5"><span className="size-1.5 rounded-full bg-foreground/70" />{x}</li>)}
          </ul>
        </div>
      </section>

      <section className="border-y">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-20 sm:px-8 md:flex-row md:items-center">
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">Ship your first model today.</h2>
          <Button asChild size="lg" className="h-11 px-6 text-base"><Link to={user ? '/dashboard' : '/login?mode=signup'}>{user ? 'Open dashboard' : 'Get started'}<ArrowRight /></Link></Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
