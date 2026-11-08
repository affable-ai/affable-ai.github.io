import { useCallback, useRef, useState, type DragEvent, type MouseEvent } from 'react'
import { ImagePlus, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError, type PromptResult } from '@/lib/api'
import { prepare } from '@/components/playground'
import { Button } from '@/components/ui/button'

type Pt = { x: number; y: number; label: 0 | 1 }

/** Playground for a promptable model: add an image, then click what you want. Shift-click leaves a part out. */
export function PromptPlayground({ owner, name }: { owner: string; name: string }) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [points, setPoints] = useState<Pt[]>([])
  const [res, setRes] = useState<PromptResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const imageId = useRef<string | null>(null)
  const seq = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const pick = useCallback(async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('Choose an image file')
    try {
      const b = await prepare(f)
      setSrc((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b) })
      setBlob(b); setPoints([]); setRes(null); imageId.current = null
    } catch (e) { toast.error((e as Error).message) }
  }, [])

  const ask = useCallback(async (pts: Pt[]) => {
    if (!blob) return
    if (!pts.length) { setRes(null); return }
    const mine = ++seq.current; setBusy(true)
    try {
      let r: PromptResult
      try { r = await api.prompt(owner, name, { image: imageId.current ? undefined : blob, imageId: imageId.current ?? undefined, points: pts }) }
      catch (e) { if (e instanceof ApiError && e.status === 404 && imageId.current) { imageId.current = null; r = await api.prompt(owner, name, { image: blob, points: pts }) } else throw e }
      if (mine !== seq.current) return
      imageId.current = r.image_id; setRes(r)
      if (!r.polygons.length) toast('Nothing found there. Try another spot.')
    } catch (e) { if (mine === seq.current) toast.error(e instanceof ApiError ? e.message : 'Something went wrong') } finally { if (mine === seq.current) setBusy(false) }
  }, [blob, owner, name])

  const click = (e: MouseEvent<HTMLDivElement>) => {
    if (!size) return
    const r = e.currentTarget.getBoundingClientRect()
    const p: Pt = { x: ((e.clientX - r.left) / r.width) * size.w, y: ((e.clientY - r.top) / r.height) * size.h, label: e.shiftKey || e.altKey ? 0 : 1 }
    const next = [...points, p].slice(-32); setPoints(next); void ask(next)
  }
  const clear = () => { seq.current++; setPoints([]); setRes(null); setBusy(false) }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); void pick(e.dataTransfer.files?.[0]) }
  const dot = size ? Math.max(size.w, size.h) / 90 : 8

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-light tracking-tight">Try it</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><ImagePlus />{src ? 'Change image' : 'Add an image'}</Button>
          <Button variant="ghost" disabled={!points.length} onClick={clear}><RotateCcw />Clear</Button>
        </div>
      </div>
      <p className="max-w-2xl text-muted-foreground">{src ? 'Click an object to select it. Shift-click to leave a part out. Each click refines the mask.' : 'This model finds what you point at. Add an image, then click an object.'}</p>
      {!src ? (
        <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
          className={`grid min-h-72 w-full place-items-center rounded-md border border-dashed bg-card/40 text-muted-foreground transition-colors hover:border-foreground ${drag ? 'border-foreground' : ''}`}>
          <span className="flex flex-col items-center gap-3 p-8"><ImagePlus className="size-8" />Drop an image here, or click to choose one</span>
        </button>
      ) : (
        <div className="relative mx-auto w-full max-w-3xl cursor-crosshair overflow-hidden rounded-md border select-none" onClick={click} aria-label="Click an object to segment it">
          <img src={src} alt="Input" draggable={false} className="block h-auto w-full" onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
          {size && (
            <svg viewBox={`0 0 ${size.w} ${size.h}`} className="pointer-events-none absolute inset-0 size-full">
              {res?.polygons.length ? <path d={res.polygons.map((p) => 'M' + p.reduce((a, v, i) => a + (i % 2 ? ',' : i ? ' L' : '') + v, '') + 'Z').join(' ')} fillRule="evenodd" fill="hsl(200 90% 60%)" fillOpacity={0.45} stroke="#fff" strokeWidth={Math.max(size.w, size.h) / 400} strokeLinejoin="round" /> : null}
              {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={dot} fill={p.label ? '#22c55e' : '#ef4444'} stroke="#fff" strokeWidth={dot / 4} />)}
            </svg>
          )}
          {busy && <div className="absolute top-3 right-3 rounded-full bg-background/80 p-2"><Loader2 className="size-4 animate-spin" /></div>}
        </div>
      )}
      {res && <p className="text-center text-sm text-muted-foreground">{res.polygons.length ? `Mask found · confidence ${Math.round(Math.min(1, res.score) * 100)}%` : 'Nothing found there.'}</p>}
    </div>
  )
}
