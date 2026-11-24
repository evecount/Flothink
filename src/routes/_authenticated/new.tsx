import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { generatePlan } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({ meta: [{ title: "New project — Flothink" }, { name: "description", content: "Let the AI producer plan your next project." }] }),
  component: NewProject,
});

const ideas = ["Launch a newsletter about urban gardening", "Ship an MVP of a habit-tracking app", "Record and release a 5-song EP"];

function NewProject() {
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generatePlan);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function go() {
    setBusy(true);
    try {
      const { projectId } = await gen({ data: { goal } });
      await qc.invalidateQueries();
      toast.success("Your plan is ready.");
      navigate({ to: "/projects/$id", params: { id: projectId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageTitle title="New project" sub="Big idea" />
      <div className="flex flex-col gap-4 px-4 sm:px-6 pt-8">
        <p className="opacity-90">Describe what you want to achieve. Your AI producer turns it into phases and tasks, scheduled across the coming weeks.</p>
        <textarea className="field min-h-36" placeholder="e.g. Launch a pop-up market for local makers" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={1000} />
        <div className="flex flex-wrap gap-2">
          {ideas.map((i) => <button key={i} className="btn-ghost" onClick={() => setGoal(i)}>{i}</button>)}
        </div>
        <button className="btn-ember" disabled={busy || goal.trim().length < 3} onClick={go}>
          <Sparkles className="size-5" /> {busy ? "Planning…" : "Generate plan"}
        </button>
      </div>
    </AppShell>
  );
}
