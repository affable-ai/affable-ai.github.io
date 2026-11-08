/**
 * Where the API lives. Empty (the default) means "same origin as this page", which is how the app
 * runs on the affable server. The GitHub Pages build sets VITE_API_BASE to the server's address, which
 * turns the site into a public, read-only front end: browsing, docs and the Playground work, while
 * signing in and anything that needs an account happens on the server's own copy of the site.
 */
export const API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? '').replace(/\/+$/, '')
export const STANDALONE = API_BASE !== ''
export const APP_URL = API_BASE
export const apiUrl = (p: string | null | undefined) => (p && p.startsWith('/api') ? API_BASE + p : (p ?? undefined))
export const siteOrigin = () => API_BASE || window.location.origin
