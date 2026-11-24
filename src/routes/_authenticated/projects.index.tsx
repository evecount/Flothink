import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, PageTitle, TaskCard } from "@/components/AppShell";
import { projectsQuery, tasksQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({ meta: [{ title: "Projects — Flothink" }, { name: "description", content: "Your whole project portfolio." }] }),
  component: Projects,
});

function Projects() {
  const { data: projects = [] } = useQuery(projectsQuery);
  const { data: tasks = [] } = useQuery(tasksQuery);
  const [tab, setTab] = useState<"Active" | "Backlog">("Active");
  const list = projects.filter((p) => p.status === tab);
  return (
    <AppShell>
      <PageTitle title="Projects" sub="Portfolio" />
      <div className="flex justify-center gap-2 pt-6">
        {(["Active", "Backlog"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-ember !py-2" : "btn-ghost"}>{t}</button>
        ))}
      </div>
      <section className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 px-4 sm:px-6 pt-6">
        {list.map((p, i) => {
          const pt = tasks.filter((t) => t.project_id === p.id);
          const done = pt.filter((t) => t.stage === "Done").length;
          const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
          return (
            <Link key={p.id} to="/projects/$id" params={{ id: p.id }}>
              <TaskCard tag={`${pct}% done`} title={p.name} meta={`${pt.length} tasks · ${p.priority}`} hot={i % 3 === 0}>
                <div className="mt-2 h-1.5 rounded-full bg-ember-soft"><div className="h-full rounded-full bg-ember" style={{ width: `${pct}%` }} /></div>
              </TaskCard>
            </Link>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-2 rounded-xl bg-paper/10 p-6 text-center">
            <p>No {tab.toLowerCase()} projects.</p>
            {tab === "Active" && <Link to="/new" className="btn-ember mt-4">Plan a project</Link>}
          </div>
        )}
      </section>
    </AppShell>
  );
}
