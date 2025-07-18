
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ArrowRight, CheckCircle, BrainCircuit, PlayCircle, BarChart, Clapperboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';


export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container grid grid-cols-1 items-center gap-12 px-4 py-20 text-center md:grid-cols-2 md:py-32 md:text-left">
          <div className="space-y-6">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary md:text-5xl lg:text-6xl">
              From Grand Vision to Actionable Scenes
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
              Flothink is your AI-powered producer, turning ambitious goals into structured, actionable tasks. Stop planning and start producing.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Your First Project <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
             <Image
                src="https://github.com/elaraNkairos/Flothink/blob/main/public/flothink-front-page.png"
                alt="Flothink app dashboard screenshot"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl"
                data-ai-hint="dashboard productivity"
              />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted py-20 md:py-32">
          <div className="container space-y-12 px-4">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold md:text-4xl">Your Personal AI Producer</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Flothink provides the structure and focus you need to direct your projects to success.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BrainCircuit className="h-8 w-8" />
                  </div>
                  <CardTitle>AI-Powered Planning</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Describe your goal, and our AI generates a comprehensive project plan, complete with acts, tasks, and micro-steps.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <PlayCircle className="h-8 w-8" />
                  </div>
                  <CardTitle>Focused Sessions</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Eliminate overwhelm. Our AI orchestrates focused work sessions, batching similar tasks from all your projects.
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BarChart className="h-8 w-8" />
                  </div>
                  <CardTitle>Project Tracking</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    Visualize your progress. Track task completion and see how far you've come on your journey to success.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <CardTitle>Integrated Learning</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                  Turn theory into practice. Link learning objectives directly to actionable tasks and apply your knowledge immediately.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="container px-4 py-20 md:py-32">
             <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold md:text-4xl">Get Productive in 3 Simple Steps</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Go from idea to execution in minutes.
              </p>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">1</div>
                    </div>
                    <h3 className="font-headline text-xl font-semibold mb-2">Define Your Goal</h3>
                    <p className="text-muted-foreground">Start by telling the AI what you want to achieve, whether it's launching a startup or learning a new skill.</p>
                </div>
                <div className="text-center">
                     <div className="flex items-center justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">2</div>
                    </div>
                    <h3 className="font-headline text-xl font-semibold mb-2">Get Your Plan</h3>
                    <p className="text-muted-foreground">Our AI producer analyzes your goal and instantly drafts a full project plan with categorized, prioritized tasks.</p>
                </div>
                <div className="text-center">
                     <div className="flex items-center justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">3</div>
                    </div>
                    <h3 className="font-headline text-xl font-semibold mb-2">Execute with Focus</h3>
                    <p className="text-muted-foreground">Launch a Focused Session. The AI creates a smart "call sheet" of tasks for you to work on in a single, productive time block.</p>
                </div>
            </div>
        </section>

        {/* Philosophy Section */}
        <section className="w-full bg-muted py-20 md:py-32">
          <div className="container grid md:grid-cols-2 gap-12 items-center px-4">
            <div className="space-y-4">
              <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">The Director's Chair is Yours</h2>
              <p className="text-lg text-muted-foreground">
                A life, like a movie set, has countless moving parts. Success isn't just about hard work; it's about smart production. That's why we built Flothink on the language of filmmaking.
              </p>
              <p className="text-muted-foreground">
                You are the **Director**. Our AI is your **Producer**, an expert in optimizing the flow of work. Just as a director shoots all the library scenes at once to save time, our AI groups similar tasks into **Focused Sessions**. This minimizes context-switching and stress on the "crew"—you. By turning a complex project into a well-managed production, you can achieve more with greater clarity and less burnout.
              </p>
            </div>
            <div className="flex justify-center">
              <Clapperboard className="w-32 h-32 md:w-48 md:h-48 text-primary/20" strokeWidth={1} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-primary text-primary-foreground">
            <div className="container flex flex-col items-center justify-center px-4 py-20 text-center">
                <h2 className="font-headline text-3xl font-bold md:text-4xl">Ready to Direct Your Success?</h2>
                <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
                    Sign up for free and turn your ambitions into achievements today. No credit card required.
                </p>
                <Button size="lg" variant="secondary" className="mt-8 text-lg" asChild>
                    <Link href="/signup">
                        Start Your Free Project Now
                    </Link>
                </Button>
            </div>
        </section>
      </main>
      <footer className="bg-muted">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
            <Logo iconClassName='h-5 w-5' className='text-base'/>
            <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Flothink. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}
