import type { NextConfig } from "next";

// Offline mode ships as plain static files (out/) that a service worker caches on the phone.
// NEXT_PUBLIC_BASE_PATH is set when hosting under a sub-folder, e.g. "/rumahlist" on GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
