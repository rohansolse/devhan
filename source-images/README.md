# Source images

Drop the edited JPGs for each event here, run the optimizer, and the row shows
up on the page.

```
source-images/events/<nn-event-name>/*.jpg
```

Then:

```bash
npm run images:optimize
```

That converts every image to WebP (plus `.w480` and `.w1080` srcset variants)
into `public/images/optimized/events/<nn-event-name>/`, mirroring the folder
names exactly. It is incremental — already-converted images are skipped, so
re-running it after adding photos only does the new ones.

Only `public/images/optimized/` is committed and deployed. The raw JPGs in here
are your working copies and stay out of git.

## The event folders

| Folder | Row title on the page |
|---|---|
| `01-pre-wedding` | Pre-Wedding |
| `02-engagement` | Engagement |
| `03-haldi-rohan` | Haldi — Rohan |
| `04-haldi-devani` | Haldi — Devani |
| `05-wedding` | The Wedding |

The numeric prefix sets the order on the page and is stripped from the title.
Titles come from `data/story.ts`, so change them there.

## Adding another event

1. Create `source-images/events/06-sangeet/` (next number) and add the JPGs.
2. Add `{ folder: "06-sangeet", title: "Sangeet" }` to `events` in `data/story.ts`.
3. Run `npm run images:optimize`.

An event folder with no photos yet is simply left off the page, so all five can
be listed before they are shot.

## Picking the hero and the profile avatars

Both are chosen by **filename stem** — `_RJL5250.jpg` is the stem `_RJL5250`.
In `data/story.ts`:

```ts
billboard: "_RJL5250",
profiles: [
  { name: "Rohan", frame: "_RJL5072" },
  ...
]
```

Leave them unset and the page picks frames on its own, so it looks right the
moment the first photos land.
