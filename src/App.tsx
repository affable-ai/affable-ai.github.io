import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useEffect } from 'react'
import { APP_URL, STANDALONE } from '@/lib/config'
import Home from '@/pages/home'
import Discover from '@/pages/discover'
import Docs from '@/pages/docs'
import Login from '@/pages/login'
import Layout from '@/pages/layout'
import Models from '@/pages/models'
import ModelDetail from '@/pages/model-detail'
import Keys from '@/pages/keys'
import SettingsPage from '@/pages/settings'
import ProfilePage from '@/pages/profile'

/** Account pages live on the server's own copy of the site; the public site hands off to it. */
function External() {
  useEffect(() => { window.location.replace(APP_URL + window.location.pathname + window.location.search) }, [])
  return <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Taking you to affable…</div>
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={150}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={STANDALONE ? <External /> : <Login />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/models/:owner/:name" element={<ModelDetail />} />
          <Route path="/dashboard" element={STANDALONE ? <External /> : <Layout />}>
            <Route index element={<Models />} />
            <Route path="keys" element={<Keys />} />
            <Route path="settings" element={<SettingsPage />} />
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
