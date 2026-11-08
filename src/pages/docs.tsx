import { useEffect } from 'react'
import { siteOrigin } from '@/lib/config'
import { Link, useLocation } from 'react-router-dom'
import { SiteHeader, SiteFooter } from '@/components/site-header'
import { CopyCode } from '@/components/copy-code'

const sections = [
  { id: 'install', title: 'Install' },
  { id: 'login', title: 'Log in' },
  { id: 'push', title: 'Push a model' },
  { id: 'pull', title: 'Pull a model' },
  { id: 'run', title: 'Run a model' },
  { id: 'filter', title: 'Detect only some classes' },
  { id: 'segmentation', title: 'Segmentation' },
  { id: 'promptable', title: 'Promptable models' },
  { id: 'visibility', title: 'Visibility & weights' },
  { id: 'phone', title: 'Phone approval' },
  { id: 'limits', title: 'Limits' },
]

const P = ({ children }: { children: React.ReactNode }) => <p className="max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{children}</p>
const C = ({ children }: { children: React.ReactNode }) => <code className="bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">{children}</code>

export default function Docs() {
  const { hash } = useLocation()
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView() }, [hash])
  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-4 pt-12 pb-24 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2 text-[15px]">
            <div className="mb-3 font-medium">Docs</div>
            {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="block text-muted-foreground hover:text-foreground">{s.title}</a>)}
          </nav>
        </aside>
        <div className="min-w-0 space-y-14">
          <h1 className="text-3xl font-semibold tracking-tight">Docs</h1>

          <section id="install" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Install</h2>
            <P>The CLI needs Python 3.9 or newer.</P><CopyCode>{'$ pip install affable'}</CopyCode></section>

          <section id="login" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Log in</h2>
            <P>Create an API key on the <Link to="/dashboard/keys" className="text-foreground underline underline-offset-4">API keys</Link> page, then paste it when prompted. The key is stored in <C>~/.config/affable/config.json</C>. You can also set <C>AFFABLE_API_KEY</C> and <C>AFFABLE_HOST</C>.</P>
            <CopyCode>{'$ affable login\n$ affable whoami'}</CopyCode></section>

          <section id="push" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Push a model</h2>
            <P>Point <C>push</C> at an <C>.onnx</C> file or a folder with exactly one <C>.onnx</C> at its top level. Companion files such as <C>.onnx_data</C> weights, configs, tokenizers and a <C>README.md</C> are uploaded with it. Every push creates a new numbered version.</P>
            <CopyCode>{'$ affable push ./my-model\n$ affable push model.onnx -n tiny -m "first cut"'}</CopyCode>
            <P>A <C>README.md</C> in the folder is rendered on the model page.</P></section>

          <section id="pull" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Pull a model</h2>
            <P>If a model's weights are open you can also download them, the latest version or a specific one. Closed models can only be run, not downloaded.</P>
            <CopyCode>{'$ affable pull owner/name\n$ affable pull owner/name -v 2 -o ./weights'}</CopyCode></section>

          <section id="run" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Run a model</h2>
            <P>YOLO-style detection and segmentation models are hosted on affable, so you can run them without downloading anything. Use the Playground tab on a model page, or call the API from Python, the CLI or plain HTTP. Public models need no login.</P>
            <CopyCode>{'import affable\n\nresult = affable.run("affable/extra-a", "photo.jpg", conf=0.35)\nfor d in result["detections"]:\n    print(d["label"], d["score"], d["box"])'}</CopyCode>
            <CopyCode>{'$ affable run affable/extra-a photo.jpg --conf 0.35\n$ curl -X POST "' + siteOrigin() + '/api/models/affable/extra-a/run?conf=0.35" --data-binary @photo.jpg'}</CopyCode>
            <P>For your own private models, run <C>affable login</C> first or pass <C>api_key=</C> in Python. Over HTTP send it as an <C>Authorization: Bearer</C> header.</P></section>

          <section id="filter" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Detect only some classes</h2>
            <P>Every detection model lists what it can detect: <C>GET /api/models/owner/name/classes</C>. Pass <C>classes</C> to look for just some of them. The model judges each box only among those classes, so they are not crowded out by others. Names are matched in any case and must exist in the model, up to 400 at a time.</P>
            <CopyCode>{'result = affable.run("affable/extra-a", "photo.jpg", classes=["vase", "chair"])\n\n$ affable run affable/extra-a photo.jpg --classes "vase,chair"\n$ curl -X POST "' + siteOrigin() + '/api/models/affable/extra-a/run?classes=vase&classes=chair" --data-binary @photo.jpg'}</CopyCode></section>
          <section id="segmentation" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Segmentation</h2>
            <P>YOLO-style segmentation models (such as YOLO26-seg exports) work like detection models, and every detection also has <C>polygons</C>: the object's mask as COCO-style polygons, one flat list <C>[x0, y0, x1, y1, ...]</C> per part, in pixels of the image you sent. Push one the same way as any other model.</P>
            <CopyCode>{'result = affable.run("owner/my-seg-model", "photo.jpg")\nfor d in result["detections"]:\n    print(d["label"], d["score"], len(d["polygons"]), "polygon(s)")'}</CopyCode></section>
          <section id="promptable" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Promptable models</h2>
            <P>A promptable model finds what you point at. Segment Anything style models (an image encoder plus a mask decoder, as ONNX) are supported. Put both files in one folder with an <C>affable.json</C> that names them, and push the folder:</P>
            <CopyCode>{'{\n  "family": "sam",\n  "name": "MobileSAM",\n  "encoder": "image_encoder.onnx",\n  "decoder": "mask_decoder.onnx",\n  "prompts": ["point", "box"]\n}\n\n$ affable push ./my-sam'}</CopyCode>
            <P>Prompts are points (include or exclude) and a box, in pixels of your image. The first call for an image encodes it; the answer includes an <C>image_id</C>, and later prompts on the same image can send just that, which is much faster.</P>
            <CopyCode>{'result = affable.prompt("owner/my-sam", "photo.jpg", points=[(320, 210)])\nprint(result["box"], result["polygons"])\n\nmore = affable.prompt("owner/my-sam", image_id=result["image_id"], points=[(320, 210)], exclude=[(400, 300)])'}</CopyCode>
            <P>The encoder takes the image resized to 1024 px on its long side and padded to 1024×1024 as 0–255 RGB; the decoder takes the usual SAM inputs. The MobileSAM ONNX release works as is. Models that take text prompts aren't supported yet.</P></section>
          <section id="visibility" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Visibility &amp; weights</h2>
            <P>New models are private. Add <C>--public</C> to list one on <Link to="/discover" className="text-foreground underline underline-offset-4">Explore</Link>. A public model can be run by anyone. Whether people can also <em>download</em> it is a separate choice: add <C>--open-weights</C> to allow downloads, or leave them closed. Both can be changed later in the model's Settings tab.</P>
            <CopyCode>{'$ affable push ./my-model --public --closed-weights\n$ affable push ./my-model --public --open-weights'}</CopyCode></section>

          <section id="phone" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Phone approval</h2>
            <P>Install <strong className="text-foreground">Discovery</strong> on your iPhone and sign in once. That registers the phone with a key that stays on it. Then turn on <strong className="text-foreground">Phone approval</strong> in <Link to="/dashboard/settings" className="underline underline-offset-4">Settings</Link> (or in Discovery's own Settings). From then on a password is not enough: signing in on the website or in studio shows a QR code, and you scan it with Discovery and tap Approve.</P>
            <P>You get eight one-time <strong className="text-foreground">recovery codes</strong> when you turn it on. If you lose the phone, a code lets you sign in and turn it off. You can also sign in with no password at all: choose “Sign in with your phone instead” on the login page and scan the code.</P>
            <P>In studio, <C>Preferences → Phone → Let my phone control this studio</C> lets Discovery list the projects you have opened there and start a labeling job. It is off by default, only reaches folders you have opened in studio, and can be turned off at any time.</P></section>

          <section id="limits" className="scroll-mt-24 space-y-4"><h2 className="text-2xl font-semibold tracking-tight">Limits</h2>
            <P>Models can have up to 5 million parameters. The CLI counts them before uploading and the server checks again, so the number can’t be spoofed.</P></section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
