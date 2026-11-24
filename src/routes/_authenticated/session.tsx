import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, SkipForward, Sparkles } from "lucide-react";
import { AppShell, PageTitle, TaskCard } from "@/components/AppShell";
import { tasksQuery, TASK_TYPES } from "@/lib/data";
import { buildCallSheet } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/session")({
  head: () => ({ meta: [{ title: "Focus session — Flothink" }, { name: "description", content: "An AI call sheet of matching tasks across your portfolio." }] }),
  component: Session,
});

function Session() {
  const { data: tasks = [] } = useQuery(tasksQuery);
  const qc = useQueryClient();
  const build = useServerFn(buildCallSheet);
  const [mode, setMode] = useState("Writing");
  const [minutes, setMinutes] = useState(60);
  const [sheet, setSheet] = useState<string[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const r = await build({ data: { mode, minutes } });
      setSheet(r.taskIds);
      setNote(r.note);
      if (!r.taskIds.length) toast("No matching open tasks found.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build a session.");
    } finally {
      setBusy(false);
    }
  }

  const current = sheet?.map((id) => tasks.find((t) => t.id === id)).filter((t) => t && t.stage !== "Done") ?? [];
  const next = () => setSheet((s) => (s ? [...s.slice(1), s[0]!] : s));

  return (
    <AppShell>
      <PageTitle title="Focus" sub="Call sheet" />
      {!sheet || current.length === 0 ? (
        <div className="flex flex-col gap-4 px-4 sm:px-6 pt-8">
          {sheet && <p className="rounded-xl bg-paper/10 p-4 text-center">Session complete. Nice work!</p>}
          <p className="opacity-90">Pick your mode and timebox. Your producer batches matching tasks from every project so you stay in flow.</p>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map((t) => <button key={t} onClick={() => setMode(t)} className={mode === t ? "btn-ember !py-2 !px-4 !text-sm" : "btn-ghost"}>{t}</button>)}
          </div>
          <div className="flex gap-2">
            {[30, 60, 90, 120].map((m) => <button key={m} onClick={() => setMinutes(m)} className={minutes === m ? "btn-ember !py-2 !px-4 !text-sm flex-1" : "btn-ghost flex-1"}>{m}m</button>)}
          </div>
          <button className="btn-ember" disabled={busy} onClick={start}><Sparkles className="size-5" /> {busy ? "Building…" : "Start session"}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-4 sm:px-6 pt-8">
          {note && <p className="text-center italic opacity-90">{note}</p>}
          <TaskCard tag="Now" hot title={current[0]!.title} meta={`${current[0]!.projects?.name ?? ""} · ${current[0]!.task_type}`} />
          <div className="flex gap-3">
            <button className="btn-ember flex-1" onClick={async () => {
              const { error } = await supabase.from("tasks").update({ stage: "Done" }).eq("id", current[0]!.id);
              if (error) toast.error(error.message);
              qc.invalidateQueries();
            }}><Check className="size-5" /> Done</button>
            <button className="btn-ghost flex-1" onClick={next}><SkipForward className="size-4" /> Skip</button>
          </div>
          <h2 className="font-display font-bold uppercase flex items-center gap-3 pt-2"><span>Up next</span><span className="h-px flex-1 bg-paper/60" /></h2>
          <div className="grid grid-cols-2 gap-3">
            {current.slice(1).map((t) => <TaskCard key={t!.id} tag={t!.task_type} title={t!.title} meta={t!.projects?.name ?? ""} />)}
          </div>
          <button className="btn-ghost" onClick={() => setSheet(null)}>End session</button>
        </div>
      )}
    </AppShell>
  );
}
