
import { NewProjectDialog } from '@/components/dashboard/new-project-dialog';
import { Target, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 lg:p-8">
      <Card className="w-full max-w-3xl text-center shadow-lg border-0">
        <CardHeader className="p-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-14 w-14 text-primary" />
          </div>
          <h1 className="mt-8 font-headline text-4xl font-bold tracking-tight text-primary md:text-5xl">
            The World is But a Stage...
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Welcome to Flothink. Let's turn your ambitious goals into actionable scenes. Our AI Producer is ready to help you write, cast, and direct your path to success.
          </p>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <NewProjectDialog>
                <Button size="lg" className="h-12 text-base">
                    <span>Start a New Project</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </NewProjectDialog>
             <Button size="lg" variant="secondary" asChild className="h-12 text-base">
                <Link href="/dashboard/session">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Start Focused Session
                </Link>
              </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
