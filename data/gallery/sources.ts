import { readdirSync } from "node:fs";
import path from "node:path";
import duplicateImages from "@/data/generated/duplicates.json";

export const EVENTS_PUBLIC_PREFIX = "/images/optimized/events";

const EVENTS_OUTPUT_DIR = path.join(
  process.cwd(),
  "public",
  "images",
  "optimized",
  "events"
);

/** `.w480.webp` / `.w1080.webp` are srcset variants, not standalone frames. */
const VARIANT_PATTERN = /\.w\d+\.webp$/;
/** Folders are ordered with a `01-` style prefix, which is not part of the title. */
const ORDER_PREFIX_PATTERN = /^\d+[-_]/;

/**
 * Near-duplicate frames found by the optimizer. The files stay on disk (and in
 * the srcset manifest) so a hand-picked billboard or avatar still resolves —
 * they are only left out of the grids and the lightbox.
 */
const duplicateSet = new Set<string>(duplicateImages as string[]);

export function isDuplicate(imagePath: string) {
  return duplicateSet.has(imagePath);
}

function readDirSafe(dir: string) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * Images dropped into `source-images/events/<folder>/` and converted by
 * `npm run images:optimize`. Read from disk, so adding photos needs no code.
 * An empty or missing folder returns `[]` — the row is simply skipped, which
 * keeps the site building before an event has been shot.
 */
export function fromEventFolder(folder: string) {
  const dir = path.join(EVENTS_OUTPUT_DIR, folder);

  return readDirSafe(dir)
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".webp") &&
        !VARIANT_PATTERN.test(entry.name)
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((name) => `${EVENTS_PUBLIC_PREFIX}/${folder}/${name}`);
}

export function toRowTitle(folder: string) {
  return folder
    .replace(ORDER_PREFIX_PATTERN, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
