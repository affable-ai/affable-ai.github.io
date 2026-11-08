import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { POSTS, fmtDate } from '@/lib/news'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { InkArt } from '@/components/ink-art'

const Tag = ({ children }: { children: string }) => <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{children}</span>

export default function Newsroom() {
  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Newsroom</h1>
        <p className="mt-2 text-muted-foreground">Announcements from affable.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p, i) => (
            <Link key={p.slug} to={`/newsroom/${p.slug}`} className={`group overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/30 ${i === 0 ? 'sm:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-[1.2fr_1fr]' : ''}`}>
              <div className={`relative overflow-hidden ${i === 0 ? 'aspect-[16/9] lg:aspect-auto lg:min-h-80' : 'aspect-[16/9]'}`}>
                <InkArt seed={p.art} variant={i === 0 ? 'hero' : 'thumb'} className="absolute inset-0 size-full transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-col justify-center p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Tag>{p.tag}</Tag>{fmtDate(p.date)}</div>
                <h2 className={`mt-3 font-semibold tracking-tight ${i === 0 ? 'text-2xl' : 'text-lg'}`}>{p.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function NewsPost() {
  const { slug } = useParams()
  const post = POSTS.find((p) => p.slug === slug)
  if (!post) return <Navigate to="/newsroom" replace />
  const more = POSTS.filter((p) => p.slug !== post.slug)
  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link to="/newsroom" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Newsroom</Link>
        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><Tag>{post.tag}</Tag>{fmtDate(post.date)}</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{post.summary}</p>
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border"><InkArt seed={post.art} variant="hero" className="absolute inset-0 size-full" /></div>
        <article className="prose prose-invert prose-lg mt-10 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-foreground prose-pre:border prose-pre:bg-card prose-code:before:hidden prose-code:after:hidden prose-table:text-base">{post.body()}</article>
        <div className="mt-16 border-t pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">More from affable</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {more.map((p) => <Link key={p.slug} to={`/newsroom/${p.slug}`} className="rounded-lg border p-4 hover:border-foreground/30"><div className="text-xs text-muted-foreground">{fmtDate(p.date)}</div><div className="mt-1 font-medium">{p.title}</div></Link>)}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
