import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { AppShell, PageTitle, TaskCard } from "@/components/AppShell";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — Flothink" }, { name: "description", content: "Find any project or task." }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const { data: projects = [] } = useQuery(projectsQuery);
  const { data: tasks = [] } = useQuery(tasksQuery);
  const s = q.trim().toLowerCase();
  const ps = s ? projects.filter((p) => (p.name + p.goal).toLowerCase().includes(s)) : [];
  const ts = s ? tasks.filter((t) => (t.title + t.task_type + t.phase).toLowerCase().includes(s)).slice(0, 20) : [];
  return (
    <AppShell>
      <PageTitle title="Search" sub="Everything" />
      <div className="px-4 sm:px-6 pt-6"><input autoFocus className="field" placeholder="Projects, tasks, types…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <section className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-x-3 gap-y-6 px-4 sm:px-6 pt-6">
        {ps.map((p) => <Link key={p.id} to="/projects/$id" params={{ id: p.id }}><TaskCard hot tag="Project" title={p.name} meta={p.status} /></Link>)}
        {ts.map((t) => <Link key={t.id} to="/projects/$id" params={{ id: t.project_id }}><TaskCard tag={t.task_type} title={t.title} meta={t.projects?.name ?? ""} /></Link>)}
        {s && !ps.length && !ts.length && <p className="col-span-2 text-center opacity-80">No matches.</p>}
      </section>
      <div className="mt-auto px-4 sm:px-6 pt-10">
        <button className="btn-ghost w-full" onClick={() => supabase.auth.signOut()}><LogOut className="size-4" /> Sign out</button>
      </div>
    </AppShell>
  );
}
