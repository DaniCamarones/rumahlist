import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RumahList: Belanja Keluarga",
    short_name: "RumahList",
    description: "Daftar belanja keluarga yang sinkron di semua HP.",
    start_url: "/",
    display: "standalone",
    background_color: "#e9e6df",
    theme_color: "#e9e6df",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
