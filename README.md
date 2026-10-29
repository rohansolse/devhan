# Devhan

A Netflix-style page for Devani & Rohan's wedding — one row per event, a
full-screen lightbox per gallery, and the opening ident before the profile gate.
Built with Next.js as a static export, same pattern as MBRJ Wedflix.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

## Adding photos for an event

1. Put the edited JPGs in `source-images/events/<nn-event>/` — the folders for
   pre-wedding, engagement, both haldis and the wedding already exist.
2. `npm run images:optimize` — converts everything to WebP plus the `.w480` /
   `.w1080` srcset variants under `public/images/optimized/events/`.
3. `npm run dev` and the row appears.

Events with no photos yet are left off the page, so nothing breaks while the
shoots are still coming in. See [source-images/README.md](source-images/README.md)
for folder naming, extra events, and picking the hero frame.

## Where things live

| Path | What it is |
|---|---|
| [data/story.ts](data/story.ts) | Names, tagline, event list, films — the whole page's content |
| [data/wedflix/](data/wedflix/) | Reads the event folders and builds the rows |
| [components/wedflix/](components/wedflix/) | Intro, profile gate, billboard, rows, lightbox |
| [scripts/optimize-images.mjs](scripts/optimize-images.mjs) | JPG → WebP + srcset variants |
| `data/generated/image-variants.json` | Generated srcset widths — rewritten by the optimizer, committed |
| `data/generated/duplicates.json` | Repeated frames hidden from the rows (files stay on disk) |
| `source-images/events/` | Raw edited JPGs (not committed) |
| `public/images/optimized/events/` | Generated WebPs (committed, deployed) |

## Deploying

Pushing to `main` runs [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml),
which builds the static export and publishes it to GitHub Pages at
<https://rohansolse.github.io/devhan/>. The workflow sets
`NEXT_PUBLIC_BASE_PATH=/devhan` because a project site is served from a
subfolder; local builds leave it empty and run at `/`.

The first run also switches the repo's Pages source from "Deploy from a branch"
to "GitHub Actions" — until then Pages serves this README instead of the site.

## Checks

```bash
npm run typecheck
npm run lint
npm run build         # static export into out/
```
