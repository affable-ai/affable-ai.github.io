import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { STANDALONE } from './config'
import { api, type User } from './api'

type Ctx = { user: User | null; loading: boolean; setUser: (u: User | null) => void; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null!)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { if (STANDALONE) { setLoading(false); return } api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const logout = useCallback(async () => { await api.logout().catch(() => {}); setUser(null) }, [])
  return <AuthCtx.Provider value={{ user, loading, setUser, logout }}>{children}</AuthCtx.Provider>
}
