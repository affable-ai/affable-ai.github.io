<p align="center"><img src="public/wordmark.svg" alt="affable." height="48"></p>

# affable website

The public website for [affable](https://affable-ai.github.io), the place to host and run small vision models.
Browse models, read the docs, and try a model in the Playground.

> ## Source available, not open source
>
> You can read this code, and that's the point of publishing it. **You can't take it.**
> Copying it, reusing the design, hosting your own version, or building a product from it is **not allowed**
> without written permission. That includes the artwork system, the wordmark and the logo.
> See [LICENSE](LICENSE) for the exact terms. If you want to use something, ask first.

## What this site is

This repository is the front end only (React, Vite, Tailwind, shadcn/ui). The accounts, model storage and
model hosting run on the affable server, which this site reads from over its public API.

The site is hosted entirely here. The affable server is just an API: it answers requests for things like the
Discover list, model pages and running a model, and this site shows them. Signing in works with a session token
the site keeps in your browser and sends to the API, so no cross-site cookies are involved.

## Run it locally (evaluation only)

```bash
npm ci
npm run dev                                        # talks to a local API at 127.0.0.1:8431
VITE_API_BASE=https://your-server npm run build    # point a build at another server
```

## Deploying

Pushing to `main` builds the site with GitHub Actions and publishes it to GitHub Pages
(`.github/workflows/pages.yml`). In the repository settings, set **Pages → Source** to **GitHub Actions**.

## Related

- `affable` on PyPI: the command line tool and Python client (`pip install affable`)
- affable studio: the desktop app for AI-assisted image labeling
