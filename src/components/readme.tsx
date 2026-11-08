import { API_BASE } from '@/lib/config'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

/** Renders a model's README.md. HTML is sanitized, and relative links/images resolve to the model's own files. */
export function Readme({ owner, name, version, path }: { owner: string; name: string; version: number; path: string }) {
  const base = `${API_BASE}/api/models/${owner}/${name}/v/${version}/files/`
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    setText(null)
    fetch(base + path).then((r) => (r.ok ? r.text() : null)).then(setText).catch(() => setText(null))
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
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} urlTransform={urlTransform}>{text}</ReactMarkdown>
    </article>
  )
}
