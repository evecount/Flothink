import { supabase } from "@/integrations/supabase/client";

async function extractErrorMessage(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  if (error instanceof Error) return error.message;
  return "Request failed. Try again.";
}

export async function generatePlan(input: { goal: string }): Promise<{ projectId: string }> {
  const goal = String(input.goal ?? "").trim();
  if (goal.length < 3 || goal.length > 1000) {
    throw new Error("Describe your goal in 3–1000 characters.");
  }
  const { data, error } = await supabase.functions.invoke<{ projectId: string }>("generate-plan", {
    body: { goal },
  });
  if (error || !data?.projectId) {
    throw new Error(await extractErrorMessage(error, data));
  }
  return data;
}

export async function buildCallSheet(input: {
  mode: string;
  minutes: number;
  channel?: string;
}): Promise<{ taskIds: string[]; note: string }> {
  const { data, error } = await supabase.functions.invoke<{ taskIds: string[]; note: string }>("build-call-sheet", {
    body: {
      mode: String(input.mode ?? "").slice(0, 40),
      minutes: Math.max(15, Math.min(480, Number(input.minutes) || 60)),
      ...(input.channel ? { channel: input.channel } : {}),
    },
  });
  if (error || !data) {
    throw new Error(await extractErrorMessage(error, data));
  }
  return { taskIds: data.taskIds ?? [], note: data.note ?? "" };
}
