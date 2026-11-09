import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useEffect } from 'react'
import { token } from '@/lib/api'
import Home from '@/pages/home'
import Discover from '@/pages/discover'
import Docs from '@/pages/docs'
import Newsroom, { NewsPost } from '@/pages/newsroom'
import Studio from '@/pages/studio'
import Login from '@/pages/login'
import Layout from '@/pages/layout'
import Models from '@/pages/models'
import ModelDetail from '@/pages/model-detail'
import Keys from '@/pages/keys'
import SettingsPage from '@/pages/settings'
import ProfilePage from '@/pages/profile'
import ConsolePage from '@/pages/console'
import Connect from '@/pages/connect'

/** Where GitHub/Google sign-in lands: the server hands the session token over in the URL fragment. */
function AuthCallback() {
  useEffect(() => {
    const t = new URLSearchParams(window.location.hash.slice(1)).get('token')
    if (t) token.set(t)
    window.location.replace(t ? '/dashboard' : '/login?error=oauth_failed')
  }, [])
  return <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Signing you in…</div>
}

const TITLES: Record<string, string> = {
  '/': 'affable', '/login': 'Sign in', '/discover': 'Discover models', '/docs': 'Docs', '/newsroom': 'Newsroom', '/studio': 'affable studio', '/connect': 'Connect the command line',
  '/dashboard': 'Your models', '/dashboard/keys': 'API keys', '/dashboard/settings': 'Settings', '/dashboard/console': 'Console',
}

/** The tab title follows the page: "Discover models · affable", a model's name, a profile's username. */
function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const p = pathname.replace(/\/+$/, '') || '/', seg = p.split('/').filter(Boolean)
    const t = TITLES[p] ?? (seg[0] === 'models' && seg.length === 3 ? `${seg[1]}/${seg[2]}` : seg[0] === 'newsroom' ? 'Newsroom' : seg.length === 1 ? seg[0] : '')
    document.title = !t || p === '/' ? 'affable' : `${t} · affable`
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={150}>
      <BrowserRouter>
        <PageTitle />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/newsroom" element={<Newsroom />} />
          <Route path="/newsroom/:slug" element={<NewsPost />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/models/:owner/:name" element={<ModelDetail />} />
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Models />} />
            <Route path="keys" element={<Keys />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="console" element={<ConsolePage />} />
          </Route>
          <Route path="/:username" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      </TooltipProvider>
    </AuthProvider>
  )
}
