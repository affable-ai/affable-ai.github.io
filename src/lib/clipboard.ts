/** Copy text. Uses the async Clipboard API when available (https / localhost) and falls back to
 *  execCommand on plain-http origins, where navigator.clipboard is undefined. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true }
  } catch { /* fall through */ }
  // append inside an open dialog if there is one, so its focus trap doesn't block the selection
  const host = (document.activeElement as HTMLElement | null)?.closest('[role="dialog"]') ?? document.body
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
  host.appendChild(ta)
  ta.select(); ta.setSelectionRange(0, text.length)
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  ta.remove()
  return ok
}
