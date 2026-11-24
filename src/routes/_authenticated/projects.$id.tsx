import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Check, Trash2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { projectsQuery, tasksQuery, TASK_TYPES, type Task } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Flothink" }, { name: "description", content: "Project plan and tasks." }] }),
  component: ProjectPage,
});

const STAGES = ["Backlog", "In Progress", "Done"] as const;

function ProjectPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: projects = [] } = useQuery(projectsQuery);
  const { data: allTasks = [] } = useQuery(tasksQuery);
  const project = projects.find((p) => p.id === id);
  const tasks = allTasks.filter((t) => t.project_id === id);
  const phases = [...new Set(tasks.map((t) => t.phase || "Tasks"))];
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Planning");
  const [due, setDue] = useState("");

  const refresh = () => qc.invalidateQueries();
  async function run(p: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await p;
    if (error) toast.error(error.message);
    refresh();
  }
  const cycle = (t: Task) => run(supabase.from("tasks").update({ stage: STAGES[(STAGES.indexOf(t.stage as never) + 1) % 3] ?? "Backlog" }).eq("id", t.id));

  if (!project) return <AppShell><p className="m-auto">Loading…</p></AppShell>;
  const done = tasks.filter((t) => t.stage === "Done").length;

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 sm:px-6 pt-6">
        <Link to="/projects" className="flex items-center gap-1 text-lg"><ChevronLeft className="size-6" /> Projects</Link>
        <button
          className="btn-ghost"
          onClick={() => run(supabase.from("projects").update({ status: project.status === "Active" ? "Backlog" : "Active" }).eq("id", id))}
        >
          {project.status === "Active" ? "Move to backlog" : "Make active"}
        </button>
      </header>
      <section className="px-4 sm:px-6 pt-6">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase leading-tight break-words">{project.name}</h1>
        <p className="mt-2 text-sm opacity-90">{project.goal}</p>
        <div className="mt-4 flex items-center gap-3 text-sm font-semibold">
          <span>{done}/{tasks.length} DONE</span>
          <span className="h-1.5 flex-1 rounded-full bg-paper/30"><span className="block h-full rounded-full bg-ember" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></span>
        </div>
      </section>

      {phases.map((ph) => (
        <section key={ph} className="px-4 sm:px-6 pt-6">
          <h2 className="font-display font-bold uppercase flex items-center gap-3"><span>{ph}</span><span className="h-px flex-1 bg-paper/60" /></h2>
          <ul className="mt-3 flex flex-col gap-2">
            {tasks.filter((t) => (t.phase || "Tasks") === ph).map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 text-ink">
                <button onClick={() => cycle(t)} aria-label="Change stage" className={`grid size-7 shrink-0 place-items-center rounded-full border-2 border-ember ${t.stage === "Done" ? "bg-ember" : t.stage === "In Progress" ? "bg-ember-soft" : ""}`}>
                  {t.stage === "Done" && <Check className="size-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${t.stage === "Done" ? "line-through opacity-60" : ""}`}>{t.title}</p>
                  <p className="text-xs opacity-75">{t.task_type} · {t.stage}{t.due_date ? ` · ${t.due_date}` : ""}</p>
                </div>
                <input type="date" value={t.due_date ?? ""} aria-label="Due date" onChange={(e) => run(supabase.from("tasks").update({ due_date: e.target.value || null }).eq("id", t.id))} className="w-8 bg-transparent text-xs opacity-60" />
                <button aria-label="Delete task" onClick={() => run(supabase.from("tasks").delete().eq("id", t.id))}><Trash2 className="size-4 opacity-60" /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <form
        className="mx-6 mt-6 flex flex-col gap-2 rounded-xl bg-paper/10 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          run(supabase.from("tasks").insert({ project_id: id, title: title.trim(), task_type: type, due_date: due || null, phase: phases[phases.length - 1] ?? "" }));
          setTitle(""); setDue("");
        }}
      >
        <input className="field" placeholder="Add a task" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        <div className="flex gap-2">
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>{TASK_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <button className="btn-ember !px-4" aria-label="Add task"><Plus className="size-5" /></button>
        </div>
      </form>

      <div className="px-4 sm:px-6 pt-6">
        <button
          className="btn-ghost w-full"
          onClick={async () => {
            if (!confirm("Delete this project and all its tasks?")) return;
            const { error } = await supabase.from("projects").delete().eq("id", id);
            if (error) { toast.error(error.message); return; }
            await refresh();
            navigate({ to: "/projects" });
          }}
        >
          <Trash2 className="size-4" /> Delete project
        </button>
      </div>
    </AppShell>
  );
}
