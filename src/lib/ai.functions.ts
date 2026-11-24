import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateChatCompletion } from "@lovable.dev/ai-gateway";

async function askJson(system: string, user: string): Promise<unknown> {
  const res = await generateChatCompletion({
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: system + "\nRespond with JSON only." },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });
  const text = res.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("The AI Producer returned nothing. Try again.");
  return JSON.parse(text.replace(/^```json\s*|```$/g, ""));
}

type Plan = {
  projectName: string;
  refinedGoal: string;
  phases: { phaseName: string; tasks: { title: string; taskType: string; easeScore: number; dayOffset: number }[] }[];
};

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goal: string }) => {
    const goal = String(input.goal ?? "").trim();
    if (goal.length < 3 || goal.length > 1000) throw new Error("Describe your goal in 3–1000 characters.");
    return { goal };
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: existing } = await supabase.from("projects").select("name, goal").limit(30);
    const plan = (await askJson(
      `You are Flothink, an AI Executive Producer for portfolio entrepreneurs. Turn a goal into ONE project plan.
Return {"projectName": string, "refinedGoal": string, "phases": [{"phaseName": string, "tasks": [{"title": string, "taskType": one of Writing|Research|Design|Build|Admin|Outreach|Planning, "easeScore": 1-5 (5 = easiest), "dayOffset": integer days from today 0-60}]}]}.
Use 2-4 thematic phases (no "Phase 1"), 3-6 concrete tasks each. Don't duplicate existing projects.`,
      `Goal: ${data.goal}\nExisting projects: ${JSON.stringify(existing ?? [])}`,
    )) as Plan;
    if (!plan?.projectName || !Array.isArray(plan.phases)) throw new Error("The AI Producer couldn't build a plan. Try rephrasing.");

    const { data: project, error } = await supabase
      .from("projects")
      .insert({ name: plan.projectName.slice(0, 120), goal: plan.refinedGoal ?? data.goal, status: "Active" })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const today = new Date();
    const rows = plan.phases.flatMap((ph) =>
      (ph.tasks ?? []).map((t) => {
        const d = new Date(today);
        d.setDate(d.getDate() + Math.max(0, Math.min(90, Math.round(Number(t.dayOffset) || 0))));
        return {
          project_id: project.id,
          phase: String(ph.phaseName ?? "").slice(0, 120),
          title: String(t.title ?? "Task").slice(0, 200),
          task_type: String(t.taskType ?? "General").slice(0, 40),
          ease_score: Math.max(1, Math.min(5, Math.round(Number(t.easeScore) || 3))),
          due_date: d.toISOString().slice(0, 10),
        };
      }),
    );
    if (rows.length) {
      const { error: tErr } = await supabase.from("tasks").insert(rows);
      if (tErr) throw new Error(tErr.message);
    }
    return { projectId: project.id };
  });

export const buildCallSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mode: string; minutes: number }) => ({
    mode: String(input.mode ?? "").slice(0, 40),
    minutes: Math.max(15, Math.min(480, Number(input.minutes) || 60)),
  }))
  .handler(async ({ data, context }) => {
    const { data: tasks, error } = await context.supabase
      .from("tasks")
      .select("id, title, task_type, ease_score, due_date, projects(name)")
      .neq("stage", "Done")
      .limit(200);
    if (error) throw new Error(error.message);
    if (!tasks?.length) return { taskIds: [] as string[], note: "No open tasks yet — create a project first." };
    const out = (await askJson(
      `You are Flothink's AI Producer. Build a focused "call sheet": pick open tasks from across the whole portfolio that match the user's cognitive mode, fit the timebox (assume ~20 min per ease 5 task, ~45 min per ease 1 task), and minimize context switching. Order them for momentum, starting with a quick win.
Return {"taskIds": string[], "note": string (one short motivating sentence)}.`,
      `Mode: ${data.mode}\nTimebox: ${data.minutes} minutes\nTasks: ${JSON.stringify(tasks)}`,
    )) as { taskIds?: string[]; note?: string };
    const valid = new Set(tasks.map((t) => t.id));
    return { taskIds: (out.taskIds ?? []).filter((id) => valid.has(id)), note: out.note ?? "" };
  });
