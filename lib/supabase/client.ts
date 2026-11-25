"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient | undefined;

export function supabase(): SupabaseClient {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

/** Turns a Supabase/Postgres error into a sentence for the UI. */
export function errorText(error: { message?: string } | null | undefined): string {
  const m = error?.message ?? "";
  if (!m) return "Terjadi kesalahan. Coba lagi.";
  if (m.includes("Invalid login credentials")) return "Email atau kata sandi salah.";
  if (m.includes("User already registered")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (m.includes("Password should be")) return "Kata sandi minimal 6 karakter.";
  if (m.includes("Email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk email kamu.";
  if (m.includes("row-level security") || m.includes("permission denied")) return "Kamu tidak punya izin untuk ini.";
  if (m.includes("Failed to fetch") || m.includes("NetworkError")) return "Tidak ada koneksi internet.";
  return m;
}
