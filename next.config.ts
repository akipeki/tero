import type { NextConfig } from "next";

// `npm run build:web` sets STATIC_EXPORT=1: a plain static site in out/ that
// any host can serve (and `npm run package:itch` turns into an itch.io zip).
const staticExport = process.env.STATIC_EXPORT === '1';

const nextConfig: NextConfig = {
  // The "N" badge sits on top of the game's bottom-left corner.
  devIndicators: false,
  ...(staticExport ? { output: 'export', trailingSlash: true } : {}),
};

export default nextConfig;
