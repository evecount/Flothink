import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell, TaskCard } from "@/components/AppShell";
import { tasksQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/upcoming")({
  head: () => ({ meta: [{ title: "Upcoming — Flothink" }, { name: "description", content: "Your tasks for the week." }] }),
  component: Upcoming,
});

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmt = (s: string) => { const [y, m, d] = s.split("-"); return `${Number(d)}/${Number(m)}/${y}`; };

function Upcoming() {
  const { data: tasks = [] } = useQuery(tasksQuery);
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const [selected, setSelected] = useState<string | null>(null);
  const todayIso = iso(today);

  const shown = useMemo(() => {
    const open = tasks.filter((t) => t.stage !== "Done" && t.due_date);
    if (selected) return open.filter((t) => t.due_date === selected);
    return open.filter((t) => t.due_date! >= iso(week[0]!) && t.due_date! <= iso(week[6]!)).slice(0, 8);
  }, [tasks, selected, weekOffset]);

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 sm:px-6 pt-6 text-xl font-medium">
        <button onClick={() => { setWeekOffset(weekOffset - 1); setSelected(null); }} className="flex items-center gap-1" aria-label="Previous week">
          <ChevronLeft className="size-7" strokeWidth={1.5} /> {week[0]!.toLocaleString("en", { month: "long" })}
        </button>
        {weekOffset !== 0 && (
          <button onClick={() => { setWeekOffset(0); setSelected(null); }} className="text-sm underline">This week</button>
        )}
        <button onClick={() => { setWeekOffset(weekOffset + 1); setSelected(null); }} aria-label="Next week"><ChevronRight className="size-7" strokeWidth={1.5} /></button>
      </header>

      <section className="px-4 sm:px-6 pt-6 text-center">
        <h1 className="font-display font-extrabold text-[clamp(1.5rem,8.4vw,2.6rem)] tracking-tight leading-none">UPCOMING</h1>
        <div className="mt-3 flex items-center gap-2 font-display font-bold text-sm sm:text-lg">
          <span>{selected && selected !== todayIso ? "DAY" : "TODAY"}</span>
          <span className="h-px flex-1 bg-paper" />
          <span className="shrink-0 shrink-0 border-x border-ember-soft px-1 uppercase">
            {(selected ? new Date(selected + "T00:00") : today).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 px-4 sm:px-6 pt-8">
        {shown.map((t, i) => (
          <Link key={t.id} to="/projects/$id" params={{ id: t.project_id }}>
            <TaskCard tag={fmt(t.due_date!)} title={t.title} meta={`${t.projects?.name ?? ""} · ${t.task_type}`} hot={i % 3 === 0} />
          </Link>
        ))}
        {shown.length === 0 && (
          <div className="col-span-2 rounded-xl bg-paper/10 p-6 text-center">
            <p>Nothing scheduled {selected ? "this day" : "this week"}.</p>
            <Link to="/new" className="btn-ember mt-4">Plan a project</Link>
          </div>
        )}
      </section>

      <section className="mt-auto grid grid-cols-7 px-4 pt-8 text-center">
        {week.map((d, i) => {
          const k = iso(d);
          const has = tasks.some((t) => t.due_date === k && t.stage !== "Done");
          const active = selected ? selected === k : k === todayIso;
          return (
            <button key={k} onClick={() => setSelected(selected === k ? null : k)} className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold">{"SMTWTFS"[i]}</span>
              <span className={`grid size-9 place-items-center rounded-full text-lg ${active ? "bg-ember" : ""}`}>{d.getDate()}</span>
              <span className={`size-1 rounded-full ${has ? "bg-paper" : ""}`} />
            </button>
          );
        })}
      </section>
    </AppShell>
  );
}
