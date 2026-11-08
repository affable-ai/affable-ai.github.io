import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Terminal } from 'lucide-react'
import { api, humanParams, type Model } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { InkArt } from '@/components/ink-art'
import { ModelCard } from '@/components/model-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CopyCode } from '@/components/copy-code'

export const pushSnippet = `$ pip install affable
$ affable login
$ affable push ./my-model`

function PushDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push a model</DialogTitle>
          <DialogDescription>Models are pushed from the command line. Create an API key first, then:</DialogDescription>
        </DialogHeader>
        <CopyCode>{pushSnippet}</CopyCode>
        <p className="text-xs text-muted-foreground">A folder needs one <code className="font-mono">.onnx</code> file; config, tokenizer and <code className="font-mono">.onnx_data</code> files come along.</p>
        <Button asChild variant="outline"><Link to="/dashboard/keys">Get an API key</Link></Button>
      </DialogContent>
    </Dialog>
  )
}

export default function Models() {
  const { user } = useAuth()
  const [models, setModels] = useState<Model[] | null>(null)
  const [max, setMax] = useState<number | null>(null)
  useEffect(() => { api.models().then(setModels).catch(() => setModels([])); api.health().then((h) => setMax(h.max_params)).catch(() => {}) }, [])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your models</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user?.username}'s private repos{max ? <> · up to <b className="font-medium text-foreground">{humanParams(max)}</b> parameters each</> : null}
          </p>
        </div>
        <PushDialog><Button><Terminal />Push a model</Button></PushDialog>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models === null && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        {models?.map((m) => <ModelCard key={m.slug} m={m} />)}
      </div>

      {models?.length === 0 && (
        <div className="relative mt-4 overflow-hidden rounded-2xl border bg-card">
          <InkArt seed="empty-state" className="absolute inset-0 size-full opacity-60" />
          <div className="relative grid place-items-center px-6 py-24 text-center">
            <div className="max-w-md rounded-xl bg-background/85 p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold tracking-tight">An empty studio.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Push your first ONNX model and it'll appear here with its own ink painting.</p>
              <div className="mt-5 text-left"><CopyCode>{pushSnippet}</CopyCode></div>
              <Button asChild variant="outline" className="mt-4"><Link to="/dashboard/keys">Create an API key</Link></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
