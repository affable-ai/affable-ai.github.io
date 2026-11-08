import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronDown, Clock, Code2, Copy, Cpu, FileText, Folder, GitBranch, HardDrive, Globe, Lock, LockOpen, Play, Settings, Shapes, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { siteOrigin } from '@/lib/config'
import { api, ago, humanParams, humanSize, type Model } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { copyText } from '@/lib/clipboard'
import { SiteFooter, SiteHeader } from '@/components/site-header'
import { Avatar } from '@/components/avatar'
import { OfficialBadge } from '@/components/official-badge'
import { Readme } from '@/components/readme'
import { CoverArtSettings } from '@/components/cover-art-settings'
import { Playground } from '@/components/playground'
import { CopyCode } from '@/components/copy-code'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const copy = async (text: string, what: string) => { if (await copyText(text)) toast.success(`${what} copied`); else toast.error('Copy failed') }
const DEFAULT_HOST = 'https://server.tail8c8f14.ts.net:8443' // what the CLI and Python client use unless told otherwise

/** The ways to call a hosted model. The host is only spelled out when it isn't the CLI's default. */
function snippets(slug: string, origin: string) {
  const other = origin !== DEFAULT_HOST
  return {
    cli: `${other ? `AFFABLE_HOST=${origin} ` : ''}affable run ${slug} photo.jpg --conf 0.35`,
    python: `import affable\n\nresult = affable.run(\n    "${slug}",\n    "photo.jpg",\n    conf=0.35,${other ? `\n    host="${origin}",` : ''}\n)\nfor d in result["detections"]:\n    print(d["label"], d["score"], d["box"])`,
    http: `curl -X POST "${origin}/api/models/${slug}/run?conf=0.35" \\\n  --data-binary @photo.jpg`,
  }
}

const SAMPLE = `{
  "model": "owner/name",
  "version": 1,
  "width": 640,
  "height": 426,
  "detections": [
    { "label": "television set", "class_id": 1090, "score": 0.6992, "box": [6.1, 166.4, 154.1, 270.6] }
  ]
}`

function ApiDocs({ m, mine }: { m: Model; mine: boolean }) {
  const [lang, setLang] = useState<'python' | 'cli' | 'http'>('python')
  const s = snippets(m.slug, siteOrigin())
  const code = { python: s.python, cli: `$ ${s.cli}`, http: `$ ${s.http}` }[lang]
  const pill = (id: 'python' | 'cli' | 'http', label: string) => (
    <button onClick={() => setLang(id)} className={`-mb-px border-b-2 px-4 py-2 text-[15px] ${lang === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>
  )
  return (
    <section className="space-y-8">
      <Heading>API</Heading>
      <p className="max-w-3xl text-lg text-muted-foreground">Run <span className="text-foreground">{m.slug}</span> from Python, the command line, or plain HTTP. The model runs on affable, so there is nothing to download.</p>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Install the client for Python or the CLI</div>
        <CopyCode>{'$ pip install affable'}</CopyCode>
      </div>
      <div className="space-y-4">
        <div className="flex border-b">{pill('python', 'Python')}{pill('cli', 'CLI')}{pill('http', 'HTTP')}</div>
        <CopyCode>{code}</CopyCode>
        {(!m.public || mine) && <p className="text-sm text-muted-foreground">{m.public ? 'Public models need no key.' : 'This model is private, so calls need your API key.'} {lang === 'http' ? 'Send it as an Authorization: Bearer header.' : 'Run affable login first, or pass api_key=.'}</p>}
      </div>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Response</div>
        <CopyCode>{SAMPLE}</CopyCode>
        <p className="text-sm text-muted-foreground">Boxes are [x0, y0, x1, y1] in pixels of the image you sent. Images can be up to 8 MB.</p>
      </div>
    </section>
  )
}

const Heading = ({ children }: { children: ReactNode }) => <h2 className="border-b pb-3 text-3xl font-light tracking-tight">{children}</h2>

function Box({ title, sub, label, rows, big, bigLabel, small }: { title: string; sub: string; label: string; rows: string[]; big: string; bigLabel: string; small?: string }) {
  return (
    <div className="border border-foreground/50 bg-black/30">
      <div className="p-4"><div className="text-lg font-semibold">{title}</div><div className="mt-0.5 text-[15px] text-muted-foreground">{sub}</div></div>
      <div className="space-y-1.5 border-t p-4"><div className="text-sm text-muted-foreground">{label}</div>{rows.map((r) => <div key={r} className="flex items-center gap-3"><span className="h-px w-3 bg-muted-foreground" /><span className="break-all text-[15px]">{r}</span></div>)}</div>
      <div className="border-t p-4"><div className="text-3xl font-medium">{big}</div><div className="mt-1 text-muted-foreground">{bigLabel}</div>{small && <div className="mt-1 text-sm text-muted-foreground/80">{small}</div>}</div>
    </div>
  )
}

export default function ModelDetail() {
  const { owner = '', name = '' } = useParams()
  const { user, loading } = useAuth()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [m, setM] = useState<Model | null>(null)
  const [max, setMax] = useState<number | null>(null)
  const [desc, setDesc] = useState('')
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (loading) return
    api.model(owner, name).then((x) => { setM(x); setDesc(x.description) }).catch(() => setMissing(true))
    api.health().then((h) => setMax(h.max_params)).catch(() => {})
  }, [owner, name, loading])

  const mine = !!user && user.username.toLowerCase() === owner.toLowerCase()
  const shell = (body: ReactNode) => (
    <div className="min-h-svh bg-background"><SiteHeader /><main className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">{body}</main><SiteFooter /></div>
  )

  if (missing) return shell(<div className="py-24 text-center"><h1 className="text-2xl font-semibold">Not found</h1><Button asChild variant="link"><Link to="/discover">Back to Discover</Link></Button></div>)
  if (!m || !m.latest) return shell(null)
  const v = m.latest
  const readme = v.files.find((f) => /^readme\.md$/i.test(f.path))
  const pull = `affable pull ${m.slug}`
  const canPull = m.open_weights || mine
  const snip = snippets(m.slug, siteOrigin())
  const tabs = [
    ...(m.hosted ? [{ id: 'playground', label: 'Playground', icon: Play }, { id: 'api', label: 'API', icon: Code2 }] : []),
    ...(readme ? [{ id: 'readme', label: 'README', icon: FileText }] : []),
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'versions', label: 'Versions', icon: GitBranch },
    ...(mine ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ]
  const tab = tabs.find((t) => t.id === params.get('tab'))?.id ?? tabs[0].id
  const chip = 'inline-flex items-center gap-2 text-[15px]'

  return shell(
    <div>
      {/* title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to={`/${m.owner}`} className="shrink-0"><Avatar username={m.owner} src={m.owner_avatar} className="size-12 sm:size-14" /></Link>
          <h1 className="min-w-0 truncate text-4xl font-light tracking-tight sm:text-5xl">
            <Link to={`/${m.owner}`} className="text-muted-foreground hover:text-foreground">{m.owner}</Link>{m.owner_official && <> <OfficialBadge className="size-7 sm:size-8" /></>}<span className="px-2 text-muted-foreground/60">/</span>{m.name}
          </h1>
          <button aria-label="Copy name" onClick={() => copy(m.slug, 'Name')} className="shrink-0 text-muted-foreground hover:text-foreground"><Copy className="size-5" /></button>
        </div>
        {(m.hosted || canPull) && <div className="flex shrink-0">
          <Button variant="outline" className="h-11 rounded-r-none px-4 text-base" onClick={() => m.hosted ? copy(snip.cli, 'Command') : copy(pull, 'Command')}><Copy />Copy</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="h-11 rounded-l-none border-l-0 px-2.5" aria-label="More copy options"><ChevronDown /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {m.hosted && <DropdownMenuItem onClick={() => copy(snip.cli, 'CLI command')}>Copy CLI command</DropdownMenuItem>}
              {m.hosted && <DropdownMenuItem onClick={() => copy(snip.python, 'Python snippet')}>Copy Python snippet</DropdownMenuItem>}
              {m.hosted && <DropdownMenuItem onClick={() => copy(snip.http, 'curl command')}>Copy curl command</DropdownMenuItem>}
              {canPull && <DropdownMenuItem onClick={() => copy(pull, 'Pull command')}>Copy pull command</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => copy(m.slug, 'Model name')}>Copy model name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => copy(siteOrigin() + `/models/${m.slug}`, 'Link')}>Copy page link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>}
      </div>

      {m.description && <p className="mt-5 max-w-3xl text-xl leading-relaxed">{m.description}</p>}

      {/* status chips */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[15px] font-medium ${m.public ? 'bg-emerald-950/70 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
          <span className={`size-2 rounded-full ${m.public ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />{m.public ? 'Public' : 'Private'}
        </span>
        {m.runnable && !m.hosted && <span className={chip}><Clock className="size-5" />{m.host_status && (m.host_status.state === 'uploading' || m.host_status.state === 'queued') ? `Preparing on host${m.host_status.state === 'uploading' ? ` (${m.host_status.pct}%)` : ''}` : 'Not hosted yet'}</span>}
        {m.task === 'segment' && <span className={chip}><Shapes className="size-5" />Segmentation</span>}
        {m.public && <span className={chip}>{m.open_weights ? <LockOpen className="size-5" /> : <Lock className="size-5" />}{m.open_weights ? 'Open weights' : 'Closed weights'}</span>}
        <span className={chip}><Cpu className="size-5" />{humanParams(v.params)} parameters</span>
        <span className={chip}><HardDrive className="size-5" />{humanSize(v.size)}</span>
        <span className={chip}><GitBranch className="size-5" />{m.versions} {m.versions === 1 ? 'version' : 'versions'}</span>
      </div>

      {/* tabs */}
      <div className="mt-8 flex gap-2 overflow-x-auto border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setParams(id === tabs[0].id ? {} : { tab: id }, { replace: true })}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-lg transition-colors ${tab === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Icon className="size-5" />{label}
          </button>
        ))}
      </div>

      <div className="mt-10 space-y-14">
        {tab === 'playground' && m.hosted && <Playground owner={owner} name={name} />}

        {tab === 'api' && m.hosted && <ApiDocs m={m} mine={mine} />}

        {tab === 'readme' && readme && (
          <>
            <section className="space-y-8">
              <Heading>Details</Heading>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
                <div className="space-y-5 text-xl leading-relaxed">
                  <p>{m.hosted ? `${m.name} is hosted on affable. Run it from Python, the CLI or plain HTTP, or try it in the Playground.` : `${m.name} is stored on affable.`}</p>
                  <div className="border-t pt-5 text-lg">
                    <Link to="/docs" className="underline underline-offset-4">Check out our docs</Link> for more about pushing, pulling and visibility.
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Box title="Latest version" sub={`v${v.number}${v.message ? ` · ${v.message}` : ''}`} label="Contains" rows={[`${v.files.length} ${v.files.length === 1 ? 'file' : 'files'}, ${humanSize(v.size)}`]} big={humanParams(v.params)} bigLabel="parameters" small={max ? `limit is ${humanParams(max)} per model` : undefined} />
                  {m.hosted
                    ? <Box title="Run with the API" sub="Python, CLI or HTTP" label="Command" rows={[`affable run ${m.slug} photo.jpg`]} big={`v${v.number}`} bigLabel="latest version" small={`${m.versions} in total · updated ${ago(m.updated_at)}${m.open_weights ? ' · weights are open' : ''}`} />
                    : canPull
                      ? <Box title="Pull with the CLI" sub="Needs affable installed" label="Command" rows={[pull]} big={`v${v.number}`} bigLabel="latest version" small={`${m.versions} in total · updated ${ago(m.updated_at)}`} />
                      : <Box title="Hosted on affable" sub="The weights are closed" label="Use it" rows={[m.runnable ? 'Not hosted yet' : 'Not supported']} big="Closed" bigLabel="weights" small={`${m.versions} in total · updated ${ago(m.updated_at)}`} />}
                </div>
              </div>
            </section>
            <section className="space-y-8">
              <Heading>Readme</Heading>
              <Readme owner={owner} name={name} version={v.number} path={readme.path} />
            </section>
          </>
        )}

        {tab === 'files' && (
          <section className="space-y-6">
            <Heading>Files <span className="text-xl text-muted-foreground">· v{v.number}</span></Heading>
            <Table>
              <TableHeader><TableRow><TableHead>Path</TableHead><TableHead className="text-right">Size</TableHead></TableRow></TableHeader>
              <TableBody>{v.files.map((f) => <TableRow key={f.path}><TableCell className="font-mono text-[14px]">{f.path}</TableCell><TableCell className="text-right text-muted-foreground">{humanSize(f.size)}</TableCell></TableRow>)}</TableBody>
            </Table>
            {canPull ? <CopyCode>{`$ ${pull}`}</CopyCode> : <p className="border p-4 text-muted-foreground">The weights for this model are closed, so the files can't be downloaded. {m.hosted ? 'You can still run it in the Playground.' : ''}</p>}
          </section>
        )}

        {tab === 'versions' && (
          <section className="space-y-6">
            <Heading>Versions</Heading>
            <Table>
              <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Message</TableHead><TableHead>Parameters</TableHead><TableHead>Size</TableHead><TableHead className="text-right">When</TableHead></TableRow></TableHeader>
              <TableBody>{m.history?.map((h) => (
                <TableRow key={h.number}>
                  <TableCell className="font-medium">v{h.number}</TableCell>
                  <TableCell className="text-muted-foreground">{h.message || '—'}</TableCell>
                  <TableCell>{humanParams(h.params)}</TableCell>
                  <TableCell>{humanSize(h.size)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{ago(h.created_at)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </section>
        )}

        {tab === 'settings' && mine && (
          <section className="space-y-10">
            <Heading>Settings</Heading>
            <CoverArtSettings m={m} onChange={(next) => setM({ ...m, cover: next.cover, cover_seed: next.cover_seed })} />
            <div className="grid max-w-2xl gap-3">
              <label className="text-sm font-medium" htmlFor="desc">Description</label>
              <div className="flex gap-2">
                <Input id="desc" value={desc} maxLength={500} placeholder="What does this model do?" onChange={(e) => setDesc(e.target.value)} />
                <Button variant="outline" disabled={desc === m.description} onClick={async () => { await api.setDescription(owner, name, desc); setM({ ...m, description: desc }); toast.success('Saved') }}>Save</Button>
              </div>
            </div>
            <div className="flex max-w-2xl items-center justify-between gap-4 border p-5">
              <div><div className="font-medium">{m.public ? 'Public' : 'Private'}</div><div className="text-sm text-muted-foreground">{m.public ? 'Listed on Discover. Anyone can download it.' : 'Only you can see and download it.'}</div></div>
              <Button variant="outline" onClick={async () => { await api.setPublic(owner, name, !m.public); setM({ ...m, public: !m.public, open_weights: m.public ? false : m.open_weights }); toast.success(m.public ? 'Now private' : 'Now public, listed on Discover') }}>
                {m.public ? <><Lock />Make private</> : <><Globe />Make public</>}
              </Button>
            </div>
            <div className="flex max-w-2xl items-center justify-between gap-4 border p-5">
              <div><div className="font-medium">{m.open_weights ? 'Open weights' : 'Closed weights'}</div><div className="text-sm text-muted-foreground">{m.open_weights ? 'Anyone can download the files, and can also run it here.' : m.public ? 'People can run the model here but can\u2019t download it.' : 'Make the model public to share it, then choose whether to open the weights.'}</div></div>
              <Button variant="outline" disabled={!m.public} onClick={async () => { await api.setOpenWeights(owner, name, !m.open_weights); setM({ ...m, open_weights: !m.open_weights }); toast.success(m.open_weights ? 'Weights are now closed' : 'Weights are now open') }}>
                {m.open_weights ? <><Lock />Close weights</> : <><LockOpen />Open weights</>}
              </Button>
            </div>
            <div className="flex max-w-2xl items-center justify-between gap-4 border border-destructive/30 p-5">
              <div><div className="font-medium">Delete this model</div><div className="text-sm text-muted-foreground">Removes every version and all stored weights.</div></div>
              <Dialog>
                <DialogTrigger asChild><Button variant="destructive"><Trash2 />Delete</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Delete {m.slug}?</DialogTitle><DialogDescription>All {m.versions} version(s) will be permanently removed from the server.</DialogDescription></DialogHeader>
                  <DialogFooter><Button variant="destructive" onClick={async () => { await api.deleteModel(owner, name); toast.success('Deleted'); nav('/dashboard') }}>Delete forever</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
