import { API_BASE, STANDALONE } from './config'

export type User = { id: number; username: string; email: string | null; name: string | null; avatar: string | null; bio: string; website: string; official: boolean; has_password: boolean; provider: string | null; created_at: number }
export type FileInfo = { path: string; size: number }
export type Version = { number: number; message: string; params: number; size: number; files: FileInfo[]; created_at: number }
export type Model = {
  owner: string; owner_avatar: string | null; name: string; slug: string; description: string
  public: boolean; open_weights: boolean; runnable: boolean; hosted: boolean; owner_official: boolean; created_at: number; updated_at: number; versions: number; latest: Version | null
  history?: Version[]
}
export type Profile = { username: string; official: boolean; name: string; avatar: string | null; bio: string; website: string; created_at: number; is_me: boolean; models: Model[] }
export type RunResult = { width: number; height: number; model: string; version: number; conf: number; detections: { class_id: number; label: string; score: number; box: number[] }[] }
export type ApiKey = { id: number; name: string; prefix: string; created_at: number; last_used: number | null }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const r = await fetch(API_BASE + url, {
    method,
    credentials: STANDALONE ? 'omit' : 'same-origin',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) {
    let msg = r.statusText
    try {
      const j = await r.json()
      msg = Array.isArray(j.detail) ? j.detail.map((d: { msg: string }) => d.msg).join('; ') : j.detail ?? msg
    } catch { /* ignore */ }
    throw new ApiError(r.status, msg)
  }
  return r.json()
}

export const api = {
  health: () => req<{ ok: boolean; max_params: number }>('GET', '/api/health'),
  providers: () => req<{ oauth: string[]; password: boolean }>('GET', '/api/auth/providers'),
  me: () => req<User>('GET', '/api/me'),
  login: (email: string, password: string) => req<User>('POST', '/api/auth/login', { email, password }),
  register: (email: string, password: string, username?: string) => req<User>('POST', '/api/auth/register', { email, password, username: username || undefined }),
  logout: () => req<{ ok: boolean }>('POST', '/api/auth/logout'),
  models: () => req<Model[]>('GET', '/api/models'),
  model: (owner: string, name: string) => req<Model>('GET', `/api/models/${owner}/${name}`),
  setDescription: (owner: string, name: string, description: string) => req('PATCH', `/api/models/${owner}/${name}`, { description }),
  setPublic: (owner: string, name: string, pub: boolean) => req('PATCH', `/api/models/${owner}/${name}`, { public: pub }),
  setOpenWeights: (owner: string, name: string, open: boolean) => req('PATCH', `/api/models/${owner}/${name}`, { open_weights: open }),
  run: async (owner: string, name: string, image: Blob, conf: number): Promise<RunResult> => {
    const r = await fetch(`${API_BASE}/api/models/${owner}/${name}/run?conf=${conf}`, { method: 'POST', credentials: STANDALONE ? 'omit' : 'same-origin', headers: { 'content-type': image.type || 'image/jpeg' }, body: image })
    if (!r.ok) { let m = r.statusText; try { m = (await r.json()).detail ?? m } catch { /* ignore */ } throw new ApiError(r.status, m) }
    return r.json()
  },
  discover: (q = '', limit = 60) => req<Model[]>('GET', `/api/discover?q=${encodeURIComponent(q)}&limit=${limit}`),
  deleteModel: (owner: string, name: string) => req('DELETE', `/api/models/${owner}/${name}`),
  profile: (username: string) => req<Profile>('GET', `/api/users/${username}`),
  deleteAvatar: () => req<User>('DELETE', '/api/me/avatar'),
  uploadAvatar: async (blob: Blob): Promise<User> => {
    const r = await fetch('/api/me/avatar', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': blob.type || 'image/png' }, body: blob })
    if (!r.ok) { let m = r.statusText; try { m = (await r.json()).detail ?? m } catch { /* ignore */ } throw new ApiError(r.status, m) }
    return r.json()
  },
  updateMe: (body: { name?: string; email?: string; bio?: string; website?: string }) => req<User>('PATCH', '/api/me', body),
  changePassword: (current: string | undefined, next: string) => req('POST', '/api/auth/password', { current, new: next }),
  logoutOthers: () => req<{ signed_out: number }>('POST', '/api/auth/logout-others'),
  deleteAccount: (confirm: string, password?: string) => req('POST', '/api/me/delete', { confirm, password }),
  keys: () => req<ApiKey[]>('GET', '/api/keys'),
  createKey: (name: string) => req<{ key: string }>('POST', '/api/keys', { name }),
  deleteKey: (id: number) => req('DELETE', `/api/keys/${id}`),
}

export function humanParams(n: number) {
  for (const [u, d] of [['B', 1e9], ['M', 1e6], ['K', 1e3]] as const) if (n >= d) return `${+(n / d).toFixed(2)}${u}`
  return String(n)
}
export function humanSize(n: number) {
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0
  while (n >= 1024 && i < 3) { n /= 1024; i++ }
  return `${i ? n.toFixed(1) : n} ${u[i]}`
}
export function ago(ts: number) {
  const s = Date.now() / 1000 - ts
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
