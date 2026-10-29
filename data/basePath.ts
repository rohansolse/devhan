/**
 * Must match `basePath` in next.config.ts. Next rewrites its own asset URLs,
 * but plain `<img>` / `<video>` sources written by hand are left alone — this
 * prefixes those.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}
