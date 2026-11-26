import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, SkipForward, Sparkles } from "lucide-react";
import { AppShell, PageTitle, TaskCard } from "@/components/AppShell";
import { tasksQuery, TASK_TYPES } from "@/lib/data";
import { buildCallSheet } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/session")({
  head: () => ({ meta: [{ title: "Focus session — Flothink" }, { name: "description", content: "An AI call sheet of matching tasks across your portfolio." }] }),
  component: Session,
});

const CHANNELS = ["All", "Email", "LinkedIn", "Luma", "Code", "Docs", "Other"] as const;

function Session() {
  const { data: tasks = [] } = useQuery(tasksQuery);
  const qc = useQueryClient();
  const [mode, setMode] = useState("Writing");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("All");
  const [minutes, setMinutes] = useState(60);
  const [sheet, setSheet] = useState<string[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDraft, setShowDraft] = useState(true);

  async function start() {
    setBusy(true);
    try {
      const r = await buildCallSheet({
        mode,
        minutes,
        ...(channel !== "All" ? { channel } : {}),
      });
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
  const nowTask = current[0];

  async function copyDraft(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Draft copied.");
    } catch {
      toast.error("Could not copy draft.");
    }
  }

  return (
    <AppShell>
      <PageTitle title="Focus" sub="Call sheet" />
      {!sheet || current.length === 0 ? (
        <div className="flex flex-col gap-4 px-4 sm:px-6 pt-8 max-w-2xl">
          {sheet && <p className="rounded-xl bg-paper/10 p-4 text-center">Session complete. Nice work!</p>}
          <p className="opacity-90">Pick your mode, channel, and timebox. Your producer batches matching tasks from every project so you stay in flow.</p>
          <div className="flex flex-wrap gap-2">
            {TASK_TYPES.map((t) => (
              <button key={t} onClick={() => setMode(t)} className={mode === t ? "btn-ember !py-2 !px-4 !text-sm" : "btn-ghost"}>{t}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button key={c} onClick={() => setChannel(c)} className={channel === c ? "btn-ember !py-1.5 !px-3.5 !text-xs" : "btn-ghost !py-1.5 !px-3.5 !text-xs"}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {[15, 30, 60, 90].map((m) => (
              <button key={m} onClick={() => setMinutes(m)} className={minutes === m ? "btn-ember !py-2 !px-4 !text-sm flex-1" : "btn-ghost flex-1"}>{m}m</button>
            ))}
          </div>
          <button className="btn-ember" disabled={busy} onClick={start}><Sparkles className="size-5" /> {busy ? "Building…" : "Start session"}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-4 sm:px-6 pt-8 max-w-3xl">
          {note && <p className="text-center italic opacity-90">{note}</p>}
          {nowTask && (
            <TaskCard
              tag={`${nowTask.projects?.name ?? "Project"} · ${nowTask.action_channel || "Other"}`}
              hot
              title={nowTask.title}
              meta={`${nowTask.task_type}${nowTask.context_hook ? ` — ${nowTask.context_hook}` : ""}`}
            >
              {nowTask.draft_seed && (
                <div className="mt-3 rounded-lg bg-ink/5 p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDraft((v) => !v)}
                      className="font-semibold uppercase tracking-wide opacity-75 hover:opacity-100"
                    >
                      {showDraft ? "Hide draft seed" : "Show draft seed"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyDraft(nowTask.draft_seed!)}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium hover:bg-ink/10"
                    >
                      <Copy className="size-3" /> Copy
                    </button>
                  </div>
                  {showDraft && <p className="mt-1.5 whitespace-pre-wrap opacity-90">{nowTask.draft_seed}</p>}
                </div>
              )}
            </TaskCard>
          )}
          <div className="flex gap-3">
            <button
              className="btn-ember flex-1"
              onClick={async () => {
                if (!nowTask) return;
                const { error } = await supabase.from("tasks").update({ stage: "Done" }).eq("id", nowTask.id);
                if (error) toast.error(error.message);
                qc.invalidateQueries();
              }}
            >
              <Check className="size-5" /> Done
            </button>
            <button className="btn-ghost flex-1" onClick={next}><SkipForward className="size-4" /> Skip</button>
          </div>
          <h2 className="font-display font-bold uppercase flex items-center gap-3 pt-2"><span>Up next</span><span className="h-px flex-1 bg-paper/60" /></h2>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-3">
            {current.slice(1).map((t) => (
              <TaskCard
                key={t!.id}
                tag={`${t!.action_channel || t!.task_type}`}
                title={t!.title}
                meta={t!.projects?.name ?? ""}
              />
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setSheet(null)}>End session</button>
        </div>
      )}
    </AppShell>
  );
}
