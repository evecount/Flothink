import { createServerFn } from "@tanstack/react-start";

// Creates a throwaway, already-confirmed demo account filled with sample projects.
export const createDemoAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const id = crypto.randomUUID().slice(0, 12);
  const email = `demo-${id}@demo.flothink.app`;
  const password = crypto.randomUUID() + "Aa1!";
  const { data: u, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !u.user) throw new Error(error?.message ?? "Could not start the demo.");
  const user_id = u.user.id;

  const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const seed = [
    { name: "Pop-up Market", goal: "Run a weekend pop-up market with 20 local makers", tasks: [
      ["Plan", "Email 20 makers about stalls", "Email", 4, 0], ["Plan", "Book the venue", "Call", 3, 1],
      ["Promote", "Design the poster", "Creative", 3, 2], ["Promote", "Post on Instagram", "Social", 5, 3] ] },
    { name: "Fun Run", goal: "Host a 5k charity fun run", tasks: [
      ["Plan", "Email council for permit", "Email", 4, 0], ["Plan", "Map the route", "Admin", 3, 2],
      ["Run", "Call sponsors", "Call", 2, 4] ] },
    { name: "Acoustic Night", goal: "Put on an acoustic live music evening", tasks: [
      ["Book", "Email three musicians", "Email", 4, 1], ["Book", "Confirm sound gear", "Call", 3, 3],
      ["Promote", "Write event listing", "Creative", 4, 5] ] },
  ] as const;

  for (const p of seed) {
    const { data: proj, error: pe } = await supabaseAdmin.from("projects")
      .insert({ user_id, name: p.name, goal: p.goal, status: "Active" }).select().single();
    if (pe) throw new Error(pe.message);
    const { error: te } = await supabaseAdmin.from("tasks").insert(p.tasks.map(([phase, title, task_type, ease_score, off]) => ({
      user_id, project_id: proj.id, phase, title, task_type, ease_score, due_date: day(off),
    })));
    if (te) throw new Error(te.message);
  }
  return { email, password };
});
