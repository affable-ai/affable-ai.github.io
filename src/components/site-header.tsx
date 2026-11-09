import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function SiteHeader() {
  const { user } = useAuth()
  const nav = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')

  // ⌘K / Ctrl+K focuses the search from anywhere
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ref.current?.focus(); ref.current?.select() } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
  const submit = (e: FormEvent) => { e.preventDefault(); nav(`/discover${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); ref.current?.blur() }

  const link = ({ isActive }: { isActive: boolean }) => `text-[13px] sm:text-sm transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
        <Link to="/"><img src="/wordmark.svg" alt="affable" className="h-6 w-auto" /></Link>
        <form onSubmit={submit} className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') ref.current?.blur() }} placeholder="Search models" className="h-9 w-full rounded-md border border-input bg-input/40 pr-14 pl-9 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30" />
          <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </form>
        <nav className="flex items-center gap-2.5 sm:gap-6">
          <NavLink to="/discover" className={link}>Discover</NavLink>
          <NavLink to="/docs" className={link}>Docs</NavLink>
          <NavLink to="/newsroom" className={link}>Newsroom</NavLink>
          <NavLink to="/studio" className={link}>Studio</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? <Button asChild size="sm"><Link to="/dashboard">Dashboard</Link></Button> : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/login">Log in</Link></Button>
              <Button asChild size="sm" className="hidden min-[420px]:inline-flex"><Link to="/login?mode=signup">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const a = 'block text-sm text-muted-foreground hover:text-foreground'
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-4 py-10 sm:px-6">
        <img src="/wordmark.svg" alt="affable" className="h-5 w-auto opacity-80" />
        <div className="flex gap-12">
          <div className="space-y-2.5"><Link className={a} to="/discover">Discover</Link><Link className={a} to="/docs">Docs</Link><Link className={a} to="/newsroom">Newsroom</Link><Link className={a} to="/studio">Studio</Link></div>
          <div className="space-y-2.5"><Link className={a} to="/login">Log in</Link><Link className={a} to="/dashboard/keys">API keys</Link></div>
        </div>
      </div>
    </footer>
  )
}
