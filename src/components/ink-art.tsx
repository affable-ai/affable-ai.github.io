import { memo, useEffect, useId, useMemo, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

/* ------------------------------------------------------------------
   Generative abstract sumi-e. Same seed -> same painting, so every
   model gets a stable, unique thumbnail with no image storage.
------------------------------------------------------------------- */
function xmur3(str: string) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0 }
}
function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

type Pt = [number, number]
const f = (n: number) => n.toFixed(1)

function blobPath(cx: number, cy: number, r: number, rnd: () => number, wobble = 0.35) {
  const n = 9, pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r * (1 - wobble / 2 + rnd() * wobble)
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (0.75 + rnd() * 0.5)])
  }
  // closed Catmull-Rom -> cubic bezier
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`
  }
  return d + 'Z'
}

/** A calligraphic stroke: bezier spine with swelling-then-tapering width. */
function strokePath(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w: number, rnd: () => number) {
  const N = 40, L: Pt[] = [], R: Pt[] = []
  const ph = rnd() * 6
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
    const len = Math.hypot(dx, dy) || 1
    const width = w * Math.pow(Math.sin(Math.PI * Math.min(0.97, t * 0.92 + 0.04)), 0.55) * (0.78 + 0.22 * Math.sin(t * 9 + ph))
    L.push([x - (dy / len) * width / 2, y + (dx / len) * width / 2])
    R.push([x + (dy / len) * width / 2, y - (dx / len) * width / 2])
  }
  return 'M' + [...L, ...R.reverse()].map(([x, y]) => `${f(x)},${f(y)}`).join('L') + 'Z'
}

const SEALS = ['#d9482b', '#b8892f', '#2f4a63', '#7a2e2e']

function InkSvg({
  seed, variant = 'thumb', className = '', animate = false, style,
}: { seed: string; variant?: 'thumb' | 'hero'; className?: string; animate?: boolean; style?: React.CSSProperties }) {
  const uid = useId().replace(/:/g, '')
  const hero = variant === 'hero'
  const W = hero ? 800 : 400, H = hero ? 1000 : 300

  const art = useMemo(() => {
    const rnd = mulberry32(xmur3(seed)())
    const R = (a: number, b: number) => a + rnd() * (b - a)

    // soft washes (diluted ink)
    const washes = Array.from({ length: hero ? 6 : 3 }, () => ({
      d: blobPath(R(0.15, 0.85) * W, R(0.15, 0.85) * H, R(0.18, hero ? 0.42 : 0.38) * Math.min(W, H) * (hero ? 1.1 : 1.2), rnd, 0.5),
      o: R(0.05, 0.16),
    }))
    // dense ink mass
    const mass = { d: blobPath(R(0.3, 0.7) * W, R(0.35, 0.65) * H, R(0.1, 0.17) * Math.min(W, H) * (hero ? 1.5 : 1.6), rnd, 0.55), o: R(0.5, 0.78) }

    // brush strokes
    const strokes = Array.from({ length: hero ? 4 : 2 }, (_, i) => {
      const s: Pt = [R(-0.05, 0.4) * W, R(0.1, 0.9) * H]
      const e: Pt = [R(0.6, 1.05) * W, R(0.1, 0.9) * H]
      return {
        d: strokePath(s, [R(0, 1) * W, R(-0.2, 1.2) * H], [R(0, 1) * W, R(-0.2, 1.2) * H], e, R(hero ? 36 : 14, hero ? 90 : 34) * (i === 0 ? 1.3 : 1), rnd),
        o: R(0.45, 0.85), dry: i % 2 === 0,
      }
    })

    // enso-ish ring: an open, uneven circle drawn with one stroke
    const cx = R(0.3, 0.7) * W, cy = R(0.3, 0.7) * H, rr = R(0.16, 0.26) * Math.min(W, H) * (hero ? 1.3 : 1)
    const a0 = R(0, 6.28), sweep = R(4.6, 5.6)
    const ang = (t: number): Pt => [cx + Math.cos(a0 + sweep * t) * rr * (1 + 0.06 * Math.sin(t * 5)), cy + Math.sin(a0 + sweep * t) * rr]
    const ring = strokePath(ang(0), ang(0.33), ang(0.66), ang(1), R(hero ? 22 : 9, hero ? 40 : 18), rnd)

    // spatter
    const drops = Array.from({ length: hero ? 26 : 12 }, () => {
      const bx = cx + R(-1, 1) * rr * 1.7, by = cy + R(-1, 1) * rr * 1.5
      return { x: bx, y: by, r: Math.pow(rnd(), 2.4) * (hero ? 9 : 4) + 0.8, o: R(0.3, 0.85) }
    })

    const seal = { x: R(0.62, 0.86) * W, y: R(0.62, 0.86) * H, s: hero ? 46 : 22, rot: R(-9, 9), c: SEALS[Math.floor(rnd() * SEALS.length)] }
    const sealSeed = R(0, 100)
    // each model's signature colour: a soft tinted wash and a matching seal (thumbnails only; hero art stays monochrome)
    const hue = Math.floor(R(0, 360))
    const accent = { hue, d: blobPath(R(0.28, 0.72) * W, R(0.3, 0.7) * H, R(0.3, 0.42) * Math.min(W, H) * 1.3, rnd, 0.5) }
    return { washes, mass, strokes, ring, drops, seal, sealSeed, accent }
  }, [seed, hero, W, H])

  const id = (s: string) => `${s}-${uid}`
  const ink = '#e9e7e0'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} style={style} role="img" aria-label="Abstract ink painting" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* ragged, bleeding edge */}
        <filter id={id('bleed')} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={hero ? 0.012 : 0.025} numOctaves="4" seed={art.sealSeed | 0} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={hero ? 46 : 20} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={hero ? 1.4 : 0.8} />
        </filter>
        {/* wash: very soft, mottled */}
        <filter id={id('wash')} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency={hero ? 0.008 : 0.018} numOctaves="3" seed={(art.sealSeed * 3) | 0} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={hero ? 80 : 36} xChannelSelector="G" yChannelSelector="R" />
          <feGaussianBlur stdDeviation={hero ? 14 : 7} />
        </filter>
        {/* dry brush: bristle gaps */}
        <filter id={id('dry')} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency={hero ? '0.9 0.025' : '1.1 0.04'} numOctaves="2" seed={(art.sealSeed * 7) | 0} result="s" />
          <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.1" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" result="c" />
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed={(art.sealSeed * 5) | 0} result="n2" />
          <feDisplacementMap in="c" in2="n2" scale={hero ? 22 : 9} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={id('stamp')} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed={(art.sealSeed * 11) | 0} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -4 2.6" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
        <radialGradient id={id('vig')} cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#09090b" stopOpacity="0" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="#0a0a0a" />

      {!hero && <g filter={`url(#${id('wash')})`} fill={`hsl(${art.accent.hue} 72% 56%)`} opacity="0.34"><path d={art.accent.d} /></g>}
      <g className={animate ? 'ink-drift' : undefined}>
        <g filter={`url(#${id('wash')})`} fill={ink}>
          {art.washes.map((w, i) => <path key={i} d={w.d} opacity={w.o} />)}
        </g>
      </g>
      <g className={animate ? 'ink-breathe' : undefined}>
        <g filter={`url(#${id('bleed')})`} fill={ink}>
          <path d={art.mass.d} opacity={art.mass.o} />
        </g>
        {art.strokes.map((s, i) => (
          <path key={i} d={s.d} fill={ink} opacity={s.o} filter={`url(#${id(s.dry ? 'dry' : 'bleed')})`} />
        ))}
        <path d={art.ring} fill={ink} opacity="0.88" filter={`url(#${id('dry')})`} />
        <g fill={ink} filter={`url(#${id('bleed')})`}>
          {art.drops.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} opacity={d.o} />)}
        </g>
      </g>

      <g transform={`translate(${art.seal.x} ${art.seal.y}) rotate(${art.seal.rot})`} filter={`url(#${id('stamp')})`} opacity="0.92">
        <rect x={-art.seal.s / 2} y={-art.seal.s / 2} width={art.seal.s} height={art.seal.s} rx={art.seal.s * 0.12} fill={hero ? art.seal.c : `hsl(${art.accent.hue} 78% 54%)`} />
        <rect x={-art.seal.s * 0.3} y={-art.seal.s * 0.3} width={art.seal.s * 0.6} height={art.seal.s * 0.6} rx={art.seal.s * 0.06} fill="none" stroke="#0b0b0c" strokeWidth={art.seal.s * 0.08} />
        <circle cx={art.seal.s * 0.1} cy={art.seal.s * 0.08} r={art.seal.s * 0.1} fill="#0b0b0c" />
      </g>
      <rect width={W} height={H} fill={`url(#${id('vig')})`} />
    </svg>
  )
}


/* ---- bitmap cache --------------------------------------------------------------------------
   SVG filters (feTurbulence/feDisplacementMap) are very expensive to keep live: every scale,
   scroll or animation frame re-rasterises them, and Safari is especially slow. So each painting
   is rendered once to a bitmap and everything after that is a plain <img>. */
const cache = new Map<string, Promise<string>>()
let queue: Promise<unknown> = Promise.resolve()

function rasterise(seed: string, variant: 'thumb' | 'hero'): Promise<string> {
  const key = `${variant}:${seed}`
  const hit = cache.get(key)
  if (hit) return hit
  const w = variant === 'hero' ? 800 : 400, h = variant === 'hero' ? 1000 : 300
  const job = queue.then(async () => {
    const markup = renderToStaticMarkup(<InkSvg seed={seed} variant={variant} />).replace('<svg ', `<svg width="${w * 2}" height="${h * 2}" `)
    const img = new Image()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup)
    await img.decode()
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('raster failed'))), 'image/webp', 0.9))
    return URL.createObjectURL(blob)
  })
  queue = job.catch(() => undefined)
  cache.set(key, job)
  job.catch(() => cache.delete(key))
  return job
}

export const InkArt = memo(function InkArt({ seed, variant = 'thumb', className = '', animate = false }: { seed: string; variant?: 'thumb' | 'hero'; className?: string; animate?: boolean; style?: React.CSSProperties }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => { let live = true; rasterise(seed, variant).then((u) => live && setUrl(u)).catch(() => {}); return () => { live = false } }, [seed, variant])
  if (!url) return <div className={className} style={{ background: '#0a0a0a' }} />
  return <img src={url} alt="" draggable={false} className={`${className} object-cover ${animate ? 'ink-drift' : ''}`} />
})
