import { Wordmark } from "./nav";

/** Sign-in and setup screens: the wordmark, then one receipt slip holding the form. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <Wordmark sub="Daftar belanja keluarga" />
      <h1 className="mt-8 font-mono text-[26px] leading-tight font-semibold">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </main>
  );
}
