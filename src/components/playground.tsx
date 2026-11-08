import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError, type RunResult } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { CopyCode } from '@/components/copy-code'

const color = (id: number) => `hsl(${(id * 47) % 360} 85% 62%)`

/** Shrink big photos before upload: keeps the request small. */
async function prepare(file: File, max = 1600): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Could not read that image')); img.src = url })
    const r = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not process that image'))), 'image/jpeg', 0.92))
  } finally { URL.revokeObjectURL(url) }
}

export function Playground({ owner, name }: { owner: string; name: string }) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [conf, setConf] = useState(0.25)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<RunResult | null>(null)
  const [view, setView] = useState<'preview' | 'json'>('preview')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pick = useCallback(async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('Choose an image file')
    try {
      const b = await prepare(f)
      setSrc((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b) })
      setBlob(b); setRes(null)
    } catch (e) { toast.error((e as Error).message) }
  }, [])

  const run = useCallback(async () => {
    if (!blob || busy) return
    setBusy(true)
    try { setRes(await api.run(owner, name, blob, conf)); setView('preview') } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Run failed') } finally { setBusy(false) }
  }, [blob, busy, conf, owner, name])

  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run() } }
    window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on)
  }, [run])

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }
  const tab = (id: 'preview' | 'json', label: string) => (
    <button onClick={() => setView(id)} className={`-mb-px border-b-2 px-4 py-2 text-[15px] ${view === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>
  )

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-0">
      <section className="space-y-6 lg:pr-10">
        <h2 className="text-3xl font-light tracking-tight">Input</h2>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2"><span className="font-mono">image</span><span className="text-sm text-muted-foreground">file</span></div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
            className={`relative grid min-h-64 w-full place-items-center overflow-hidden rounded-md border border-dashed bg-card/40 text-muted-foreground transition-colors hover:border-foreground ${drag ? 'border-foreground' : ''}`}>
            {src ? <img src={src} alt="Input" className="max-h-96 w-full object-contain" /> : <span className="flex flex-col items-center gap-3 p-8"><ImagePlus className="size-8" />Drop an image here, or click to choose</span>}
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between"><span className="font-mono">conf</span><span className="font-mono text-sm text-muted-foreground">{conf.toFixed(2)}</span></div>
          <input type="range" min={0.05} max={0.95} step={0.05} value={conf} onChange={(e) => setConf(+e.target.value)} className="w-full accent-foreground" />
          <p className="text-sm text-muted-foreground">Minimum confidence for a detection.</p>
        </div>
        <div className="flex justify-end">
          <Button size="lg" disabled={!blob || busy} onClick={run} className="h-11 px-6 text-base">{busy ? <Loader2 className="animate-spin" /> : <Play />}Run <span className="font-mono text-xs opacity-60">(⌘↵)</span></Button>
        </div>
      </section>

      <section className="space-y-6 lg:border-l lg:pl-10">
        <h2 className="text-3xl font-light tracking-tight">Output</h2>
        <div className="flex border-b">{tab('preview', 'Preview')}{tab('json', 'JSON')}</div>
        {!res && !busy && <div className="grid min-h-64 place-items-center rounded-md border border-dashed text-muted-foreground">Results appear here</div>}
        {busy && <div className="grid min-h-64 place-items-center rounded-md border text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>}
        {res && !busy && view === 'preview' && src && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-md border">
              <img src={src} alt="Result" className="block w-full" />
              <svg viewBox={`0 0 ${res.width} ${res.height}`} className="absolute inset-0 size-full" preserveAspectRatio="none">
                {res.detections.map((d, i) => {
                  const [x0, y0, x1, y1] = d.box, sw = Math.max(res.width, res.height) / 300, fs = Math.max(res.width, res.height) / 45
                  return (
                    <g key={i}>
                      {d.polygons?.length
                        ? <path d={d.polygons.map((p) => 'M' + p.reduce((a, v, k) => a + (k % 2 ? ',' : k ? ' L' : '') + v, '') + 'Z').join(' ')} fillRule="evenodd" fill={color(d.class_id)} fillOpacity={0.35} stroke={color(d.class_id)} strokeWidth={sw} strokeLinejoin="round" />
                        : <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={color(d.class_id)} strokeWidth={sw} />}
                      <rect x={x0} y={Math.max(0, y0 - fs * 1.3)} width={(d.label.length + 5) * fs * 0.58} height={fs * 1.3} fill={color(d.class_id)} />
                      <text x={x0 + fs * 0.25} y={Math.max(0, y0 - fs * 1.3) + fs} fontSize={fs} fill="#0a0a0a" fontFamily="ui-monospace,monospace" fontWeight={600}>{d.label} {Math.round(d.score * 100)}%</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{res.detections.length} {res.detections.length === 1 ? 'object' : 'objects'} {res.detections.length === 0 ? '· try a lower confidence' : ''}</p>
          </div>
        )}
        {res && !busy && view === 'json' && <CopyCode>{JSON.stringify(res, null, 2)}</CopyCode>}
      </section>
    </div>
  )
}
