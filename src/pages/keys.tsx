import { useEffect, useState, type FormEvent } from 'react'
import { Check, Copy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, ago, type ApiKey } from '@/lib/api'
import { CopyCode } from '@/components/copy-code'
import { copyText } from '@/lib/clipboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function Keys() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [fresh, setFresh] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const load = () => api.keys().then(setKeys).catch(() => setKeys([]))
  useEffect(() => { load() }, [])

  async function create(e: FormEvent) {
    e.preventDefault()
    try { setFresh((await api.createKey(name || 'cli')).key); setName(''); load() } catch (err) { toast.error((err as Error).message) }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>
          <p className="mt-2 text-sm text-muted-foreground">Keys let the <code className="font-mono">affable</code> CLI act as you. Treat them like passwords.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setFresh(null); setCopied(false) } }}>
          <DialogTrigger asChild><Button><Plus />New key</Button></DialogTrigger>
          <DialogContent>
            {fresh ? (
              <>
                <DialogHeader><DialogTitle>Copy your key</DialogTitle><DialogDescription>This is the only time it will be shown.</DialogDescription></DialogHeader>
                <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                  <code className="min-w-0 flex-1 break-all font-mono text-[13px]">{fresh}</code>
                  <Button size="icon" variant="outline" onClick={async () => { if (await copyText(fresh)) setCopied(true); else toast.error('Copy failed. Select the key and copy it manually.') }}>{copied ? <Check /> : <Copy />}</Button>
                </div>
                <CopyCode>{`$ affable login`}</CopyCode>
              </>
            ) : (
              <form onSubmit={create} className="space-y-4">
                <DialogHeader><DialogTitle>New API key</DialogTitle><DialogDescription>Name it after where you'll use it.</DialogDescription></DialogHeader>
                <div className="space-y-2"><Label htmlFor="kn">Name</Label><Input id="kn" autoFocus placeholder="laptop" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></div>
                <Button type="submit" className="w-full">Create key</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Created</TableHead><TableHead>Last used</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {keys?.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell className="font-mono text-[13px] text-muted-foreground">{k.prefix}…</TableCell>
                <TableCell className="text-muted-foreground">{ago(k.created_at)}</TableCell>
                <TableCell className="text-muted-foreground">{k.last_used ? ago(k.last_used) : 'never'}</TableCell>
                <TableCell className="text-right"><Button size="icon" variant="ghost" aria-label="Revoke" onClick={async () => { await api.deleteKey(k.id); toast.success('Key revoked'); load() }}><Trash2 /></Button></TableCell>
              </TableRow>
            ))}
            {keys?.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No keys yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
