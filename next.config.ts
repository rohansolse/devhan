import type { NextConfig } from "next";

/**
 * GitHub Pages serves a project site from `/<repo>/`, so every URL needs that
 * prefix. Set `NEXT_PUBLIC_BASE_PATH=/devhan` for the Pages build; local dev
 * leaves it empty and runs at the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
