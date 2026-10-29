import { cpus } from "node:os";
import path from "node:path";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";

const projectRoot = process.cwd();

// Each root is walked recursively and mirrored into its output directory, so a
// new event only needs a folder here — never a new script.
const imageRoots = [
  {
    name: "event",
    sourceDir: path.join(projectRoot, "source-images", "events"),
    outputDir: path.join(projectRoot, "public", "images", "optimized", "events")
  }
];

/**
 * Env overrides are opt-in: anything unset, blank or out of range falls back to
 * the documented default rather than quietly becoming 0.
 */
function readNumberEnv(name, fallback, { min, max }) {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < min || value > max) {
    console.warn(`Ignoring ${name}="${raw}" (expected ${min}-${max}); using ${fallback}.`);
    return fallback;
  }

  return value;
}

const maxWidth = readNumberEnv("IMAGE_MAX_WIDTH", 2200, { min: 1, max: 20000 });
const maxHeight = readNumberEnv("IMAGE_MAX_HEIGHT", 2200, { min: 1, max: 20000 });
const quality = readNumberEnv("IMAGE_WEBP_QUALITY", 72, { min: 1, max: 100 });
// `cpus()` can come back empty on some hosts, so keep a floor of one worker.
const concurrency = Math.max(
  1,
  Math.min(readNumberEnv("IMAGE_CONCURRENCY", 4, { min: 1, max: 64 }), cpus().length)
);
const rasterExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ignoredFileNames = new Set([".DS_Store", "Thumbs.db"]);
// Responsive variants served via srcset — must match data/responsiveImages.ts.
const variantWidths = [480, 1080];
const variantSuffixPattern = /\.w\d+\.webp$/;

// Mirrors data/responsiveImages.ts: path -> [[candidatePath, realWidth], ...].
const manifestPath = path.join(
  projectRoot,
  "data",
  "generated",
  "image-variants.json"
);
const duplicatesPath = path.join(
  projectRoot,
  "data",
  "generated",
  "duplicates.json"
);
const manifest = {};

// Near-duplicate detection: burst frames of the same pose are kept on disk but
// hidden from the page. 12 of the 64 dHash bits catches a burst that drifts
// (someone turns, the frame shifts) without the colour check below ever
// letting unrelated photos through.
const duplicateThreshold = readNumberEnv("IMAGE_DUPLICATE_THRESHOLD", 12, {
  min: 0,
  max: 64
});
// Shape alone is not enough: guests photographed one after another against the
// same backdrop land inside the hash threshold. Colour tells them apart, so a
// frame counts as a repeat only when both agree.
const duplicateColourThreshold = readNumberEnv("IMAGE_DUPLICATE_COLOUR", 20, {
  min: 0,
  max: 255
});
const duplicates = [];

function toVariantPath(fullWebpPath, width) {
  return fullWebpPath.replace(/\.webp$/, `.w${width}.webp`);
}

/** Absolute path under public/ -> the URL the browser requests. */
function toPublicPath(absolutePath) {
  return `/${path
    .relative(path.join(projectRoot, "public"), absolutePath)
    .split(path.sep)
    .join("/")}`;
}

/** Mean per-channel difference between two 16x16 RGB thumbnails, 0-255. */
function colourDistance(a, b) {
  let total = 0;

  for (let index = 0; index < a.length; index += 1) {
    total += Math.abs(a[index] - b[index]);
  }

  return total / a.length;
}

async function colourThumbnail(filePath) {
  return sharp(filePath)
    .resize(16, 16, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
}

/**
 * 64-bit difference hash: each bit says whether a pixel is brighter than the
 * one to its right in a 9x8 greyscale thumbnail. Near-identical frames land a
 * few bits apart, so Hamming distance measures "same photo again".
 */
async function perceptualHash(filePath) {
  const pixels = await sharp(filePath)
    .greyscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();

  // One byte per row of the thumbnail: bit set when a pixel is brighter than
  // the one to its right.
  const hash = Buffer.alloc(8);

  for (let y = 0; y < 8; y += 1) {
    let row = 0;

    for (let x = 0; x < 8; x += 1) {
      row = (row << 1) | (pixels[y * 9 + x] > pixels[y * 9 + x + 1] ? 1 : 0);
    }

    hash[y] = row;
  }

  return hash;
}

const POPCOUNT = Uint8Array.from({ length: 256 }, (_, byte) =>
  byte
    .toString(2)
    .split("")
    .reduce((total, bit) => total + Number(bit), 0)
);

function hammingDistance(a, b) {
  let distance = 0;

  for (let index = 0; index < a.length; index += 1) {
    distance += POPCOUNT[a[index] ^ b[index]];
  }

  return distance;
}

/**
 * Walks one folder's images in display order and marks each one that is within
 * the threshold of an earlier keeper, so the first shot of every burst
 * survives. Folders are compared separately: two events can legitimately hold
 * similar frames, and an event must never be emptied by an earlier one.
 */
async function collectDuplicates(fullWebpFiles) {
  const byFolder = new Map();

  for (const filePath of fullWebpFiles) {
    const folder = path.dirname(filePath);
    const folderFiles = byFolder.get(folder);

    if (folderFiles) {
      folderFiles.push(filePath);
    } else {
      byFolder.set(folder, [filePath]);
    }
  }

  for (const [, folderFiles] of byFolder) {
    const ordered = folderFiles.sort((a, b) =>
      a.localeCompare(b, "en", { numeric: true })
    );

    // Hash the full-size files, not the variants: an already-downscaled
    // variant blurs detail and pushes distinct frames inside the threshold.
    // Hashing is the slow part, so it runs through the same worker pool.
    const signatures = new Array(ordered.length);

    await runPool(
      ordered.map((filePath, index) => async () => {
        signatures[index] = {
          hash: await perceptualHash(filePath),
          colour: await colourThumbnail(filePath)
        };
        return false;
      })
    );

    const kept = [];

    ordered.forEach((filePath, index) => {
      const signature = signatures[index];
      const isRepeat = kept.some(
        (keeper) =>
          hammingDistance(keeper.hash, signature.hash) <= duplicateThreshold &&
          colourDistance(keeper.colour, signature.colour) <=
            duplicateColourThreshold
      );

      if (isRepeat) {
        duplicates.push(toPublicPath(filePath));
      } else {
        kept.push(signature);
      }
    });
  }
}

async function measureWidth(filePath) {
  const { width } = await sharp(filePath).metadata();
  return width ?? null;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredFileNames.has(entry.name) || entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!rasterExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function toOutputPath(sourcePath, root) {
  const relativePath = path.relative(root.sourceDir, sourcePath);
  return path.join(root.outputDir, relativePath.replace(/\.[^.]+$/, ".webp"));
}

async function isFresh(sourcePath, destinationPath) {
  try {
    const [sourceStats, destinationStats] = await Promise.all([
      stat(sourcePath),
      stat(destinationPath)
    ]);

    return destinationStats.mtimeMs >= sourceStats.mtimeMs && destinationStats.size > 0;
  } catch {
    return false;
  }
}

async function optimizeOne(sourcePath, root) {
  const destinationPath = toOutputPath(sourcePath, root);

  if (await isFresh(sourcePath, destinationPath)) {
    return { converted: false, destinationPath };
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await sharp(sourcePath)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality, effort: 6 })
    .toFile(destinationPath);

  return { converted: true, destinationPath };
}

async function generateVariant(fullWebpPath, width) {
  const destinationPath = toVariantPath(fullWebpPath, width);
  const fresh = await isFresh(fullWebpPath, destinationPath);

  if (!fresh) {
    await sharp(fullWebpPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(destinationPath);
  }

  return { generated: !fresh, destinationPath };
}

/**
 * One manifest entry per full-size image: each existing variant plus the
 * full-size file, measured rather than assumed, smallest width first.
 */
async function recordCandidates(fullWebpPath, variantPaths) {
  const candidates = [];

  for (const variantPath of variantPaths) {
    const width = await measureWidth(variantPath);

    if (width) {
      candidates.push([toPublicPath(variantPath), width]);
    }
  }

  const fullWidth = await measureWidth(fullWebpPath);

  if (fullWidth) {
    candidates.push([toPublicPath(fullWebpPath), fullWidth]);
  }

  // A resize that hit `withoutEnlargement` can duplicate a width; keep the
  // first (smallest file) candidate for each distinct width.
  const byWidth = new Map();

  for (const candidate of candidates.sort((a, b) => a[1] - b[1])) {
    if (!byWidth.has(candidate[1])) {
      byWidth.set(candidate[1], candidate);
    }
  }

  manifest[toPublicPath(fullWebpPath)] = [...byWidth.values()];
}

async function runPool(jobs) {
  let index = 0;
  let completed = 0;

  async function worker() {
    while (index < jobs.length) {
      const job = jobs[index];
      index += 1;

      if (await job()) {
        completed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return completed;
}

async function optimizeRoot(root) {
  let sourceFiles = [];

  try {
    await stat(root.sourceDir);
    sourceFiles = await walk(root.sourceDir);
  } catch {
    console.log(`No raw ${root.name} images found. Checking responsive variants only.`);
  }

  const converted = await runPool(
    sourceFiles.map((sourcePath) => async () => (await optimizeOne(sourcePath, root)).converted)
  );

  console.log(
    `Optimized ${sourceFiles.length} ${root.name} images to WebP (${converted} regenerated, max ${maxWidth}x${maxHeight}, quality ${quality}).`
  );

  // Backfill responsive variants for every full-size WebP, including ones
  // whose raw source is no longer on this machine.
  let fullWebpFiles = [];

  try {
    await stat(root.outputDir);
    fullWebpFiles = (await walk(root.outputDir)).filter(
      (filePath) => filePath.endsWith(".webp") && !variantSuffixPattern.test(filePath)
    );
  } catch {
    return;
  }

  const variantJobs = fullWebpFiles.map((fullWebpPath) => async () => {
    const results = await Promise.all(
      variantWidths.map((width) => generateVariant(fullWebpPath, width))
    );

    await recordCandidates(
      fullWebpPath,
      results.map((result) => result.destinationPath)
    );

    return results.some((result) => result.generated);
  });
  const generated = await runPool(variantJobs);

  console.log(
    `Responsive variants up to date for ${fullWebpFiles.length} ${root.name} images (widths ${variantWidths.join(", ")}, ${generated} regenerated).`
  );

  const before = duplicates.length;
  await collectDuplicates(fullWebpFiles);

  console.log(
    `Hid ${duplicates.length - before} near-duplicate ${root.name} images (hamming <= ${duplicateThreshold} and colour <= ${duplicateColourThreshold}); files stay on disk.`
  );
}

async function main() {
  for (const root of imageRoots) {
    await optimizeRoot(root);
  }

  // Rewritten from scratch every run, so deleted images drop out of the
  // manifest instead of leaving 404 srcset candidates behind.
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2)}\n`
  );

  await writeFile(
    duplicatesPath,
    `${JSON.stringify([...duplicates].sort(), null, 2)}\n`
  );

  console.log(
    `Wrote srcset manifest for ${Object.keys(manifest).length} images and a skip list of ${duplicates.length}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
