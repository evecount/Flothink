import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Screen } from "@/components/AppShell";
import { createDemoAccount } from "@/lib/demo.functions";
import logo from "@/assets/flothink-wordmark.png.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Flothink" },
      { name: "description", content: "Sign in to Flothink, your AI producer." },
      { property: "og:title", content: "Sign in — Flothink" },
      { property: "og:description", content: "Sign in to Flothink, your AI producer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

const G = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/upcoming" });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error, data } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/upcoming" } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) toast.success("Check your email to confirm your account.");
  }

  async function demo() {
    setBusy(true);
    try {
      const c = await createDemoAccount();
      const { error } = await supabase.auth.signInWithPassword(c);
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the demo.");
    } finally { setBusy(false); }
  }

  async function oauth(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/login" });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  }

  return (
    <Screen>
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-8 py-10">
        <div className="mx-auto">
          <img src={logo.url} alt="Flothink" className="w-full max-w-64" />
        </div>
        <h1 className="text-center font-display text-[clamp(1.4rem,7.5vw,2.2rem)] font-extrabold uppercase">{mode === "in" ? "Welcome back" : "Get started"}</h1>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field" type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="btn-ember">{mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
        <div className="flex flex-col gap-2">
          <button disabled={busy} onClick={demo} className="btn-google">Try the demo — no sign-up</button>
          <button onClick={() => oauth("google")} className="btn-google"><G /> Continue with Google</button>
          <button onClick={() => oauth("lovable")} className="btn-google"><LovableMark className="size-[18px]" /> Continue with Lovable</button>
        </div>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-sm underline opacity-90">
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </Screen>
  );
}
