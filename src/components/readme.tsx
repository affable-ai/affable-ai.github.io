import { authHeaders } from '@/lib/api'
import { API_BASE } from '@/lib/config'
import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const CALLOUTS: Record<string, { label: string; cls: string }> = {
  WARNING: { label: 'Warning', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-200' },
  CAUTION: { label: 'Caution', cls: 'border-red-400/40 bg-red-400/10 text-red-200' },
  NOTE: { label: 'Note', cls: 'border-sky-400/40 bg-sky-400/10 text-sky-200' },
  IMPORTANT: { label: 'Important', cls: 'border-violet-400/40 bg-violet-400/10 text-violet-200' },
  TIP: { label: 'Tip', cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' },
}

/** GitHub-style alerts (> [!WARNING]) become coloured callouts; any other blockquote stays a normal quote. */
function Blockquote({ children }: { children?: ReactNode }) {
  const kids = Children.toArray(children).filter((c) => !(typeof c === 'string' && !c.trim()))
  const first = kids[0]
  if (isValidElement(first)) {
    const inner = Children.toArray((first.props as { children?: ReactNode }).children)
    const head = typeof inner[0] === 'string' ? inner[0] : ''
    const m = /^\s*\[!(WARNING|CAUTION|NOTE|IMPORTANT|TIP)\]\s*/i.exec(head)
    if (m) {
      const c = CALLOUTS[m[1].toUpperCase()]
      const rest = [head.slice(m[0].length), ...inner.slice(1)].filter((x) => x !== '')
      return (
        <div role="note" className={`not-prose my-6 rounded-lg border px-4 py-3 text-[0.95em] leading-relaxed ${c.cls}`}>
          <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><TriangleAlert className="size-4" />{c.label}</div>
          <div className="text-foreground/90 [&_strong]:text-foreground">{rest.length ? <p>{rest}</p> : null}{kids.slice(1)}</div>
        </div>
      )
    }
  }
  return <blockquote>{children}</blockquote>
}

/** Renders a model's README.md. HTML is sanitized, and relative links/images resolve to the model's own files. */
export function Readme({ owner, name, version, path }: { owner: string; name: string; version: number; path: string }) {
  const base = `${API_BASE}/api/models/${owner}/${name}/v/${version}/files/`
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    setText(null)
    fetch(base + path, { headers: authHeaders() }).then((r) => (r.ok ? r.text() : null)).then(setText).catch(() => setText(null))
  }, [base, path])
  if (!text) return null

  const urlTransform = (url: string) => {
    if (/^(https?:|mailto:|#|\/)/i.test(url)) return /^javascript:/i.test(url) ? '' : url
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return ''
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : ''
    return base + new URL(dir + url, 'http://x/').pathname.slice(1)
  }

  return (
    <article className="prose prose-invert prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-foreground prose-img:rounded-md prose-pre:border prose-pre:bg-card prose-code:before:hidden prose-code:after:hidden prose-table:text-base [&_img[alt='affable.']]:invert [&_img[alt='affable.']]:mx-auto [&_img[alt='affable.']]:h-12 [&_img[alt='affable.']]:w-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} urlTransform={urlTransform} components={{ blockquote: Blockquote }}>{text}</ReactMarkdown>
    </article>
  )
}
