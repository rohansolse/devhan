import imageVariants from "@/data/generated/image-variants.json";

/**
 * Written by scripts/optimize-images.mjs: every optimized image mapped to its
 * real srcset candidates. Measured from the generated files, so the `w`
 * descriptors match the pixels actually served — `fit: "inside"` and
 * `withoutEnlargement` mean a portrait or small frame is never the nominal
 * max width.
 */
// JSON tuples widen to (string | number)[] on import, so assert the shape the
// optimizer actually writes.
const variantManifest = imageVariants as unknown as Record<
  string,
  [string, number][]
>;

export function toImageSrc(sourcePath: string) {
  return encodeURI(sourcePath);
}

export function toResponsiveSrcSet(sourcePath: string) {
  const candidates = variantManifest[sourcePath];

  // No entry means the image is not one of ours (a YouTube thumbnail) or the
  // manifest is stale — either way, ship the plain src rather than 404s.
  if (!candidates?.length) {
    return undefined;
  }

  return candidates
    .map(([path, width]) => `${encodeURI(path)} ${width}w`)
    .join(", ");
}
