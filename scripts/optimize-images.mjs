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

const maxWidth = Number(process.env.IMAGE_MAX_WIDTH ?? 2200);
const maxHeight = Number(process.env.IMAGE_MAX_HEIGHT ?? 2200);
const quality = Number(process.env.IMAGE_WEBP_QUALITY ?? 72);
const requestedConcurrency = Number(process.env.IMAGE_CONCURRENCY);
const concurrency = Math.max(
  1,
  Math.min(
    Number.isFinite(requestedConcurrency) ? requestedConcurrency : 4,
    cpus().length
  )
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
const manifest = {};

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

  console.log(`Wrote srcset manifest for ${Object.keys(manifest).length} images.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
