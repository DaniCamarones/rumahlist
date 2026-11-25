"use client";

import { useEffect } from "react";
import { asset } from "@/lib/base-path";

/** Registers the offline cache (public build only; dev server pages change too often to cache). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(asset("/sw.js"), { scope: asset("/") }).catch(() => {});
  }, []);
  return null;
}
