import type { MetadataRoute } from "next";
import { asset } from "@/lib/base-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RumahList: Belanja Pribadi",
    short_name: "RumahList",
    description: "Daftar belanja yang tersimpan di HP dan jalan tanpa internet.",
    id: asset("/"),
    start_url: asset("/"),
    scope: asset("/"),
    display: "standalone",
    background_color: "#e9e6df",
    theme_color: "#e9e6df",
    lang: "id",
    icons: [
      { src: asset("/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: asset("/icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: asset("/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
