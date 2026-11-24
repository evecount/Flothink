import { Link } from "@tanstack/react-router";
import { CalendarDays, FolderKanban, ImagePlus, Plus, Search, Timer } from "lucide-react";
import { useRef, type ChangeEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { buildCustomSkinFromFile, useFlothinkTheme, type FlothinkTheme } from "@/lib/theme";

const nav = [
  { to: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/new", label: "New project", icon: Plus },
  { to: "/session", label: "Focus", icon: Timer },
  { to: "/search", label: "Search", icon: Search },
] as const;

const themes: { id: FlothinkTheme; label: string }[] = [
  { id: "ember", label: "Ember" },
  { id: "slate", label: "Slate" },
];

export function Screen({ children }: { children: ReactNode }) {
  const { theme, customSkin, setTheme, applyCustomSkin } = useFlothinkTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickBackground(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const skin = await buildCustomSkinFromFile(file);
      applyCustomSkin(skin);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load background.");
    }
  }

  const hasCustom = theme === "custom" && Boolean(customSkin?.imageDataUrl);

  return (
    <div className="min-h-screen bg-ink-deep flex flex-col">
      <main
        className={`${hasCustom ? "" : "bg-ember-gradient "}grain relative w-full min-h-screen flex flex-col font-sans text-paper overflow-x-hidden bg-cover bg-center`}
        style={hasCustom ? { backgroundImage: `linear-gradient(to bottom, rgb(0 0 0 / 0.45), rgb(0 0 0 / 0.65)), url(${customSkin!.imageDataUrl})` } : undefined}
      >
        {theme === "slate" && (
          <img
            src="/flothink-speckle.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none fixed -top-10 -right-12 w-[340px] md:w-[540px] opacity-20 invert"
          />
        )}
        <div className="relative z-20 mx-auto flex w-full max-w-6xl justify-end px-4 sm:px-8 pt-3 md:pt-5">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickBackground} />
          <div className="inline-flex items-center rounded-full border border-paper/25 bg-ink-deep/40 p-0.5 backdrop-blur-sm text-[11px] font-medium">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`rounded-full px-2.5 py-0.5 transition-colors ${theme === t.id ? "bg-paper text-ink-deep" : "text-paper/75 hover:text-paper"
                  }`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (customSkin && theme !== "custom") setTheme("custom");
                else fileRef.current?.click();
              }}
              title={theme === "custom" ? "Change custom background" : "Upload your own background"}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 transition-colors ${theme === "custom" ? "bg-paper text-ink-deep" : "text-paper/75 hover:text-paper"
                }`}
            >
              <ImagePlus className="size-3" />
              {theme === "custom" ? "Your set" : "Custom"}
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Screen>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-6 md:px-6 md:py-4">
        <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:gap-2 md:rounded-2xl md:border md:border-paper/20 md:bg-ink-deep/30 md:p-4 md:backdrop-blur-sm md:self-start md:sticky md:top-6">
          <Link to="/" className="px-2 pb-3">
            <img src="/flothink-wordmark.png" alt="Flothink" className="w-32" />
          </Link>
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
              activeProps={{ className: "!bg-ember !text-ink-deep font-semibold" }}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              <span>{label}</span>
            </Link>
          ))}
        </aside>
        <div className="flex-1 flex flex-col pb-4 min-w-0">{children}</div>
      </div>
      <nav className="relative z-10 md:hidden sticky bottom-0 flex justify-around border-t border-paper/60 bg-ink-deep/30 backdrop-blur py-3">
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
                <span className={`grid size-10 place-items-center rounded-full shrink-0 ${isActive ? "bg-ember text-ink-deep" : ""}`}>
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
