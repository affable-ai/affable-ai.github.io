import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Coins, KeyRound, LogOut, Boxes, Compass, Settings, ShieldCheck, User as UserIcon } from 'lucide-react'
import { api, usd, type Credits } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function Layout() {
  const { user, loading, logout } = useAuth()
  const nav = useNavigate()
  const [credits, setCredits] = useState<Credits | null>(null)
  if (loading) return <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Loading…</div>
  if (!user) return <Navigate to="/login" replace />

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to="/dashboard"><img src="/wordmark.svg" alt="affable" className="h-6 w-auto" /></Link>
          <nav className="flex gap-1">
            <NavLink to="/dashboard" end className={link}><Boxes className="size-4" />Models</NavLink>
            <NavLink to="/dashboard/keys" className={link}><KeyRound className="size-4" />API keys</NavLink>
            <NavLink to="/discover" className={link}><Compass className="size-4" />Discover</NavLink>
            <NavLink to="/dashboard/settings" className={link}><Settings className="size-4" />Settings</NavLink>
            {user.official && <NavLink to="/dashboard/console" className={link}><ShieldCheck className="size-4" />Console</NavLink>}
          </nav>
          <div className="ml-auto">
            <DropdownMenu onOpenChange={(o) => { if (o) api.credits().then(setCredits).catch(() => {}) }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar username={user.username} src={user.avatar} className="size-6" rounded="rounded-full" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal"><div className="text-sm font-medium">{user.username}</div><div className="truncate text-xs text-muted-foreground">{user.email}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav('/dashboard/settings')} aria-label="Credits" className="items-start"><Coins className="mt-0.5" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span>Credits</span><span className="font-medium" data-testid="menu-credits">{!credits ? '…' : usd(credits.total_usd)}</span></span>{credits && <span className="block text-xs text-muted-foreground">{usd(credits.free_usd)} free today</span>}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav(`/${user.username}`)}><UserIcon />Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav('/dashboard/settings')}><Settings />Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav('/dashboard/keys')}><KeyRound />API keys</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await logout(); nav('/login') }}><LogOut />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><Outlet /></main>
    </div>
  )
}
