import { supabase } from "@/integrations/supabase/client";

export async function createDemoAccount(): Promise<{ email: string; password: string }> {
  const { data, error } = await supabase.functions.invoke<{ email: string; password: string }>("create-demo-account");
  if (error || !data?.email || !data?.password) {
    const msg =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : error instanceof Error
          ? error.message
          : "Could not start the demo.";
    throw new Error(msg);
  }
  return data;
}
