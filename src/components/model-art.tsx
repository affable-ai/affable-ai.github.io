import { InkArt } from '@/components/ink-art'
import { apiUrl } from '@/lib/config'
import type { Model } from '@/lib/api'

/** A model's cover: the picture its owner uploaded, else the generated ink painting (their chosen variant, or the default for the model). */
export function ModelArt({ m, className = 'size-full' }: { m: Pick<Model, 'slug' | 'cover' | 'cover_seed'>; className?: string }) {
  return m.cover
    ? <img src={apiUrl(m.cover)} alt="" draggable={false} loading="lazy" className={`${className} object-cover`} />
    : <InkArt seed={m.cover_seed || m.slug} className={className} />
}
