export function ListSkeleton({ label = "Memuat daftar" }: { label?: string }) {
  return (
    <div className="paper mt-6 px-4 py-3" aria-busy="true" aria-label={label}>
      <p className="font-mono text-[13px] text-muted">{label}…</p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="size-6 animate-pulse bg-line" />
          <div className="h-4 flex-1 animate-pulse bg-line/70" />
          <div className="h-4 w-16 animate-pulse bg-line/70" />
        </div>
      ))}
    </div>
  );
}
