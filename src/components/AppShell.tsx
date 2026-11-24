import { Link } from "@tanstack/react-router";
import { CalendarDays, FolderKanban, Plus, Search, Timer } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/new", label: "New project", icon: Plus },
  { to: "/session", label: "Focus", icon: Timer },
  { to: "/search", label: "Search", icon: Search },
] as const;

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-deep flex justify-center">
      <main className="bg-ember-gradient grain w-full max-w-md min-h-screen flex flex-col font-sans text-paper overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Screen>
      <div className="relative z-10 flex-1 flex flex-col pb-4">{children}</div>
      <nav className="relative z-10 sticky bottom-0 flex justify-around border-t border-paper/60 bg-ink-deep/30 backdrop-blur py-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-label={label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[9px] uppercase tracking-wide truncate text-paper/70"
            activeProps={{ className: "text-paper" }}
          >
            {({ isActive }) => (
              <>
                <span className={`grid size-10 place-items-center rounded-full shrink-0 ${isActive ? "bg-ember" : ""}`}>
                  <Icon className="size-6" strokeWidth={1.3} />
                </span>
                <span className="max-w-full truncate">{label === "New project" ? "New" : label}</span>
              </>
            )}
          </Link>
        ))}
      </nav>
    </Screen>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <section className="px-4 sm:px-6 pt-8 text-center">
      <h1 className="font-display font-extrabold text-[clamp(1.5rem,8.4vw,2.6rem)] tracking-tight leading-none uppercase">{title}</h1>
      {sub && (
        <div className="mt-3 flex items-center gap-3 font-display font-bold text-base uppercase">
          <span className="h-px flex-1 bg-paper" />
          <span>{sub}</span>
          <span className="h-px flex-1 bg-paper" />
        </div>
      )}
    </section>
  );
}

export function TaskCard({ tag, title, meta, hot, children }: { tag: string; title: string; meta?: string; hot?: boolean; children?: ReactNode }) {
  return (
    <article className="relative pt-4">
      <span className={`absolute top-0 left-2 max-w-[90%] truncate rounded-full px-4 py-1 text-xs font-medium text-ink ${hot ? "bg-ember" : "bg-ember-soft"}`}>
        {tag}
      </span>
      <div className="rounded-xl bg-paper px-3 pt-6 pb-3 text-ink shadow-lg h-full">
        <h2 className="font-semibold leading-snug break-words">{title}</h2>
        {meta && <p className="mt-1 text-xs leading-snug opacity-80">{meta}</p>}
        {children}
      </div>
    </article>
  );
}
