import { useRef, useState } from 'react'
import { ImagePlus, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError, type Model } from '@/lib/api'
import { InkArt } from '@/components/ink-art'
import { ModelArt } from '@/components/model-art'
import { Button } from '@/components/ui/button'

const VARIANTS = 6

/** Repo settings: change the picture shown on this model's card. Upload your own, or pick another generated ink painting. */
export function CoverArtSettings({ m, onChange }: { m: Model; onChange: (next: Pick<Model, 'cover' | 'cover_seed'>) => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Something went wrong')
  const run = async (what: string, fn: () => Promise<Model>, done: string) => {
    setBusy(what)
    try { const next = await fn(); onChange({ cover: next.cover, cover_seed: next.cover_seed }); toast.success(done) } catch (e) { fail(e) } finally { setBusy(null) }
  }
  const upload = (f: File | undefined) => {
    if (!f) return
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return toast.error('Use a PNG, JPEG or WebP image')
    if (f.size > 4 * 1024 * 1024) return toast.error('That image is over 4 MB')
    void run('upload', () => api.uploadCover(m.owner, m.name, f), 'Cover updated')
  }
  const seeds = ['', ...Array.from({ length: VARIANTS }, (_, i) => `${m.slug}#${i + 1}`)]
  const current = m.cover ? null : (m.cover_seed ?? '')
  const custom = !!m.cover || !!m.cover_seed
  return (
    <div className="grid max-w-2xl gap-4">
      <div>
        <div className="text-sm font-medium">Cover art</div>
        <div className="text-sm text-muted-foreground">Shown on this model's card in Discover and on your profile. Uploaded pictures are cropped to 3:2.</div>
      </div>
      <div className="flex flex-wrap items-start gap-5">
        <div className="aspect-[3/2] w-60 shrink-0 overflow-hidden border border-foreground/30"><ModelArt m={m} /></div>
        <div className="flex flex-col gap-2">
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
          <Button variant="outline" disabled={busy !== null} onClick={() => file.current?.click()}>{busy === 'upload' ? <Loader2 className="animate-spin" /> : <ImagePlus />}Upload an image</Button>
          <Button variant="ghost" disabled={busy !== null || !custom} onClick={() => run('reset', () => api.resetCover(m.owner, m.name), 'Back to the default')}>{busy === 'reset' ? <Loader2 className="animate-spin" /> : <RotateCcw />}Use the default</Button>
          <p className="max-w-52 text-xs text-muted-foreground">PNG, JPEG or WebP, up to 4 MB.</p>
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm text-muted-foreground">Or pick another painting</div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {seeds.map((s, i) => (
            <button key={s || 'default'} type="button" disabled={busy !== null} aria-label={i === 0 ? 'Default painting' : `Painting ${i}`} aria-pressed={current === s}
              onClick={() => run(`seed${i}`, () => api.setCoverSeed(m.owner, m.name, s), 'Cover updated')}
              className={`relative aspect-[3/2] overflow-hidden border transition-colors ${current === s ? 'border-foreground ring-2 ring-foreground/60' : 'border-foreground/20 hover:border-foreground/60'}`}>
              <InkArt seed={s || m.slug} className="size-full" />
              {i === 0 && <span className="absolute right-1 bottom-1 rounded bg-background/80 px-1 text-[10px]">Default</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
