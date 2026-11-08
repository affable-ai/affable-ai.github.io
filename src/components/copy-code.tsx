import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText } from '@/lib/clipboard'

export function CopyCode({ children, className = '', wrap = false }: { children: string; className?: string; wrap?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <div className={`group relative rounded-lg border bg-card text-foreground ${className}`}>
      <pre className={`p-4 pr-12 font-mono text-[13px] leading-relaxed ${wrap ? 'break-all whitespace-pre-wrap' : 'overflow-x-auto'}`}>{children}</pre>
      <button
        aria-label="Copy"
        className="absolute top-3 right-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={async () => { if (await copyText(children.replace(/^\$ /gm, ''))) { setDone(true); setTimeout(() => setDone(false), 1500) } }}
      >{done ? <Check className="size-4" /> : <Copy className="size-4" />}</button>
    </div>
  )
}
