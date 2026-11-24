import { supabase } from "@/integrations/supabase/client";
import { createDemoAccount } from "@/lib/demo.functions";
import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Screen, TaskCard } from "@/components/AppShell";
import logo from "@/assets/flothink-wordmark.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flothink — Big ideas, small actions" },
      { name: "description", content: "Flothink breaks tasks down across multiple projects and batches them into 15-, 30-, or 60-minute sprints so you get more done and keep your day free." },
      { property: "og:title", content: "Flothink — Big ideas, small actions" },
      { property: "og:description", content: "Turn goals into 15-, 30-, or 60-minute batched sprints across all your projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { session } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (session) navigate({ to: "/upcoming" });
  }, [session, navigate]);
  return (
    <Screen>
      <div className="relative z-10 flex flex-col items-center gap-6 px-5 py-12 text-center">
        <img src={logo.url} alt="Flothink" className="w-full max-w-72" />
        <h1 className="font-display text-[clamp(1.5rem,8vw,2.6rem)] font-extrabold uppercase leading-none">Do more. Keep your day.</h1>
        <p className="max-w-sm text-sm opacity-90">
          AI breaks tasks down across all your projects and batches them into 15-, 30-, or 60-minute sprints — without you having to remember why.
        </p>
        <Link to="/login" className="btn-ember w-full max-w-xs">Get started</Link>
      </div>

      <section className="relative z-10 flex flex-col gap-6 px-5 pb-4">
        <h2 className="flex items-center gap-3 font-display font-bold uppercase"><span>Sound familiar?</span><span className="h-px flex-1 bg-paper/60" /></h2>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-x-3 gap-y-6">
          {questions.map((q, i) => (
            <TaskCard key={q} tag={`Q${i + 1}`} hot={i % 3 === 0} title={q} />
          ))}
        </div>
      </section>

      <section className="relative z-10 flex flex-col gap-4 px-5 py-10">
        <h2 className="font-display text-[clamp(1.3rem,7vw,2.2rem)] font-extrabold uppercase leading-none text-center">Flothink batches it</h2>
        <p className="text-center text-sm opacity-90">
          Think of it like a movie set: instead of resetting the crew five times, you shoot everything happening in the same room in one scene. Flothink groups similar tasks across all your projects into focused sprints so you accomplish more and keep most of your day free.
        </p>
        <ul className="flex flex-col gap-3">
          {steps.map((s) => (
            <li key={s.title} className="rounded-xl bg-paper px-4 py-3 text-ink">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm opacity-80">{s.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2">
          <button onClick={startDemo} className="btn-ember">Try the demo</button>
          <Link to="/login" className="btn-google">Sign up free</Link>
        </div>
      </section>
    </Screen>
  );
}

const questions = [
  "Juggling multiple projects at once and tired of holding it all in your head?",
  "Switching between half-finished tasks and losing momentum every time you reset?",
  "Want a 15-, 30-, or 60-minute sprint ready to go without remembering why?",
  "Ready to finish more of your list and still have most of your day free?",
];

const steps = [
  { title: "Give Flothink your goals", body: "AI breaks your projects into small, concrete tasks and remembers the whole sequence for you." },
  { title: "Batch into 15, 30, or 60-min sprints", body: "Similar tasks across projects are grouped together so you clear a whole block in one sitting." },
  { title: "Keep most of your day free", body: "Finish what matters, step away cleanly, and enjoy the rest of your day." },
];

async function startDemo() {
  try {
    const c = await createDemoAccount();
    const { error } = await supabase.auth.signInWithPassword(c);
    if (error) throw error;
    window.location.assign("/upcoming");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Could not start the demo.");
  }
}
