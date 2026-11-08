import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export type Post = { slug: string; title: string; date: string; tag: 'Product' | 'Model'; summary: string; art: string; body: () => ReactNode }

const A = ({ to, children }: { to: string; children: ReactNode }) => <Link to={to}>{children}</Link>
const Code = ({ children }: { children: string }) => <pre><code>{children}</code></pre>

/** Newest first. */
export const POSTS: Post[] = [
  {
    slug: 'affable-studio',
    title: 'Introducing affable studio',
    date: '2026-11-08',
    tag: 'Product',
    summary: 'A desktop app for labeling images where a model does the first pass and you do the review.',
    art: 'affable-studio',
    body: () => (
      <>
        <p>Labeling images is slow because it starts from nothing. affable studio starts from a first draft. Open a folder, pick a model, and it proposes the boxes. You accept what is right, fix what is close, and reject what is wrong.</p>
        <h2>The model does the first pass</h2>
        <p>Pick any detection model from affable. <strong>Cloud</strong> runs it on affable, so a small laptop is enough. <strong>Offline</strong> runs a downloaded copy on your own machine, with no internet and nothing leaving your computer. Offline needs open weights, so the model's author decides whether it is available.</p>
        <h2>Review at the speed of a keystroke</h2>
        <ul>
          <li><code>Enter</code> accepts a suggestion, <code>X</code> rejects it, <code>⇧A</code> accepts every suggestion on the image.</li>
          <li>Double-click a box's label to rename it or give it a different class.</li>
          <li><code>⇧R</code> labels the whole folder, and you review it afterwards.</li>
        </ul>
        <h2>Your data, in the format you need</h2>
        <p>Import existing labels from COCO, YOLO, Pascal VOC or LabelMe. Export to COCO, YOLO, Pascal VOC, LabelMe, Create ML or CSV. Your images are never modified, and your work autosaves next to them.</p>
        <h2>Models and library</h2>
        <p>The built-in Discover page lists public models on affable. Open one to read its README and details, add it to your library, and download it if its weights are open.</p>
        <h2>Sign in, and it follows you</h2>
        <p>Signing in with your affable account unlocks your private models and saves your studio preferences to your account, so a new machine feels like your old one.</p>
        <h2>Get it</h2>
        <p>affable studio is available now for Mac with Apple silicon. <A to="/studio">Go to the studio page</A> to download it.</p>
      </>
    ),
  },
  {
    slug: 'extra-b',
    title: 'extra-b, the bigger annotator',
    date: '2026-11-08',
    tag: 'Model',
    summary: 'The upgraded extra-a. A much larger network, the same 1,203 object categories, hosted on affable.',
    art: 'affable/extra-b',
    body: () => (
      <>
        <p>extra-b is the upgraded version of extra-a. It is a YOLO26x fine-tuned on LVIS, so it detects the same 1,203 everyday object categories, from <em>aerosol can</em> to <em>zucchini</em>, with a far larger network behind it.</p>
        <table>
          <thead><tr><th></th><th>extra-a</th><th>extra-b</th></tr></thead>
          <tbody>
            <tr><td>Base model</td><td>YOLO26n</td><td>YOLO26x</td></tr>
            <tr><td>Parameters</td><td>2.72 M</td><td>57.07 M</td></tr>
            <tr><td>File size</td><td>5.3 MB</td><td>109 MB</td></tr>
            <tr><td>LVIS minival AP</td><td>22.2</td><td>31.1</td></tr>
            <tr><td>Weights</td><td>Open</td><td>Closed</td></tr>
          </tbody>
        </table>
        <h2>The numbers</h2>
        <p>We evaluated both models on the 4,809 LVIS minival images with the official LVIS API, using the same images and settings. extra-b scores <strong>31.1 AP</strong>, which is 8.9 ahead of extra-a's 22.2. The gain is biggest on small objects (26.8 against 13.5) and on frequent categories (46.6 against 29.2).</p>
        <img src="/img/news/extra-b-lvis.webp" alt="LVIS minival box AP: extra-a 22.2 and extra-b 31.1 next to published open-vocabulary detectors" />
        <h2>What it doesn't fix</h2>
        <p>extra-b is not better everywhere. On rare categories it scores lower than extra-a (0.4 against 4.4). It is better with people (32.0 AP, up from 18.3), but that is still far below cats, dogs or pizza, so don't rely on it to find or count people.</p>
        <p>Against published open-vocabulary models, extra-b is ahead of YOLOE-26s (30.8) and Grounding DINO-T (27.4), and behind YOLOE-26m (35.4) and YOLOE-26x (40.6). Those are zero-shot results from their authors, on their own pipelines, so read the chart as context rather than a controlled comparison.</p>
        <p>One more illustration: on a single photo at confidence 0.35, extra-a found 3 objects and extra-b found 11.</p>
        <p>extra-b's weights are closed. You can run it on affable, from the Playground, the CLI, Python or HTTP, but you can't download it. Use it for pre-annotation in affable studio, and the first draft gets a lot closer.</p>
        <Code>{`import affable\n\nresult = affable.run("affable/extra-b", "photo.jpg", conf=0.35)\nfor d in result["detections"]:\n    print(d["label"], d["score"], d["box"])`}</Code>
        <p><A to="/models/affable/extra-b">Open extra-b</A></p>
      </>
    ),
  },
  {
    slug: 'extra-a',
    title: 'Introducing extra-a',
    date: '2026-11-07',
    tag: 'Model',
    summary: 'A small general-purpose object annotator that detects 1,203 categories and runs on a plain CPU.',
    art: 'affable/extra-a',
    body: () => (
      <>
        <p>extra-a is a small general-purpose object annotator: a YOLO26n fine-tuned on LVIS. It detects 1,203 everyday object categories and is small enough to run on a plain CPU. It has 2.72 million parameters and the file is 5.3 MB.</p>
        <p>It is built for labelling and pre-annotation. We measured it on the 4,809 LVIS minival images with the official LVIS evaluation and it scores <strong>22.2 AP</strong>. Open-vocabulary models such as YOLOE score higher, but they are larger. extra-a's advantage is size, speed and a fixed, prompt-free label set.</p>
        <h2>Know its limits</h2>
        <p>extra-a is weak on people, at 18.3 AP for the person class, and on rare categories. It is meant to propose, with a person reviewing. The model page lists every limitation next to the numbers.</p>
        <h2>Open weights</h2>
        <p>extra-a's weights are open. Run it on affable, or download it and run it yourself, including offline in affable studio. It inherits the AGPL-3.0 license from Ultralytics.</p>
        <p><A to="/models/affable/extra-a">Open extra-a</A></p>
      </>
    ),
  },
]

export const fmtDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
