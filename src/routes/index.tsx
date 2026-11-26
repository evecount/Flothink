import { supabase } from "@/integrations/supabase/client";
import { createDemoAccount } from "@/lib/demo.functions";
import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [refSource, setRefSource] = useState<string>("");

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (param) {
      window.localStorage.setItem("flothink-ref", param);
      setRefSource(param);
    } else {
      setRefSource(window.localStorage.getItem("flothink-ref") ?? "");
    }
  }, []);

  useEffect(() => {
    if (session) navigate({ to: "/upcoming" });
  }, [session, navigate]);

  const feedbackSubject = encodeURIComponent(
    refSource ? `Flothink feedback (via ${refSource})` : "Flothink feedback",
  );
  return (
    <Screen>
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <div className="relative z-10 flex flex-col items-center gap-6 py-12 md:py-20 text-center">
          <img src={logo.url} alt="Flothink" className="w-full max-w-72 md:max-w-80" />
          <h1 className="font-display text-[clamp(1.75rem,6vw,3.5rem)] font-extrabold uppercase leading-none">Do more. Keep your day.</h1>
          <p className="max-w-xl text-sm md:text-base opacity-90">
            AI breaks tasks down across all your projects and batches them into 15-, 30-, or 60-minute sprints — without you having to remember why.
          </p>
          <div className="flex w-full max-w-xs md:max-w-md flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="btn-ember flex-1">Get started</Link>
            <button onClick={startDemo} className="btn-ghost flex-1 !py-3">Try the demo</button>
          </div>
        </div>

        <section className="relative z-10 flex flex-col gap-6 pb-8">
          <h2 className="flex items-center gap-3 font-display font-bold uppercase text-base md:text-lg"><span>Sound familiar?</span><span className="h-px flex-1 bg-paper/60" /></h2>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
            {questions.map((q, i) => (
              <TaskCard key={q} tag={`Q${i + 1}`} hot={i % 3 === 0} title={q} />
            ))}
          </div>
        </section>

        <section className="relative z-10 flex flex-col gap-6 py-10 md:py-16">
          <h2 className="font-display text-[clamp(1.4rem,5vw,2.5rem)] font-extrabold uppercase leading-none text-center">Flothink batches it</h2>
          <p className="mx-auto max-w-2xl text-center text-sm md:text-base opacity-90">
            Think of it like a movie set: instead of resetting the crew five times, you shoot everything happening in the same room in one scene. Flothink groups similar tasks across all your projects into focused sprints so you accomplish more and keep most of your day free.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s) => (
              <li key={s.title} className="rounded-xl bg-paper px-5 py-4 text-ink shadow-lg">
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm opacity-80">{s.body}</p>
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-4 flex w-full max-w-md flex-col sm:flex-row gap-3">
            <button onClick={startDemo} className="btn-ember flex-1">Try the demo</button>
            <Link to="/login" className="btn-google flex-1">Sign up free</Link>
          </div>
        </section>

        <footer className="relative z-10 border-t border-paper/20 py-8 text-center text-xs text-paper/80 flex flex-col gap-2">
          <p>
            Built in the open —{" "}
            <a
              href={`mailto:gwen@evecount.com?subject=${feedbackSubject}`}
              className="underline hover:text-paper font-medium"
            >
              What should we build next?
            </a>
          </p>
          <p className="opacity-75">
            An Eve Count property ·{" "}
            <a href={`mailto:gwen@evecount.com?subject=${feedbackSubject}`} className="hover:underline">
              gwen@evecount.com
            </a>
          </p>
        </footer>
      </div>
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
