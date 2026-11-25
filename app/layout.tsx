import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import { ServiceWorker } from "@/components/service-worker";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

// Plex Mono prints the receipt lines (items, prices, totals) like a cash register;
// Plex Sans, from the same family, carries instructions and forms where mono reads slowly.
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "RumahList",
  description: "Daftar belanja pribadi yang tersimpan di HP dan jalan tanpa internet.",
  appleWebApp: { capable: true, title: "RumahList", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#e9e6df",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plexMono.variable} ${plexSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-counter font-sans">
        <ToastProvider>
          <AppProvider>{children}</AppProvider>
        </ToastProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
