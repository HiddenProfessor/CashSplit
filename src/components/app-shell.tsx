import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";

type AppShellProps = {
  user: {
    name: string;
    email: string;
  };
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function AppShell({
  user,
  eyebrow,
  title,
  subtitle,
  children,
  backHref,
  backLabel,
}: AppShellProps) {
  return (
    <main className="fine-grid min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-14 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6 lg:gap-8">
        <header className="glass-panel flex flex-col gap-4 rounded-[1.75rem] px-4 py-4 sm:rounded-[2rem] sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 sm:space-y-4">
              {backHref && backLabel ? (
                <Link href={backHref} className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-muted transition hover:border-line-strong hover:text-foreground">
                  {backLabel}
                </Link>
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent-deep">{eyebrow}</p>
                <h1 className="display-type mt-2 text-3xl leading-none tracking-tight sm:mt-3 sm:text-5xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:mt-4 sm:text-lg sm:leading-7">{subtitle}</p>
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-3 rounded-[1.25rem] border border-line bg-white/70 p-4 sm:w-auto sm:min-w-64 sm:items-end sm:rounded-[1.5rem]">
              <div className="text-sm">
                <p className="font-semibold">{user.name}</p>
                <p className="text-muted">{user.email}</p>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="w-full rounded-full border border-line-strong px-4 py-2 text-sm font-semibold transition hover:border-foreground sm:w-auto">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}