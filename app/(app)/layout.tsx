import { BottomNav, Sidebar } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-12">{children}</main>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
