import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;
export type Task = Tables<"tasks">;
export type TaskWithProject = Task & { projects: { name: string } | null };

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, projects(name)")
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data as TaskWithProject[];
  },
});

export const TASK_TYPES = ["Writing", "Research", "Design", "Build", "Admin", "Outreach", "Planning"];
