/** Sub-folder the app is served from ("" at the domain root, "/rumahlist" on GitHub Pages). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes a public-folder path; next/link adds the base path itself, plain <img> and fetch do not. */
export const asset = (path: string) => `${BASE_PATH}${path}`;
