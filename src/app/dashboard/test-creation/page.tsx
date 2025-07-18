
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createProjectShell } from '@/lib/firestore';
import { generateProjectPlan } from '@/lib/project-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

// A simple, basic goal to test the fundamental flow.
const MOCK_INITIAL_GOAL = "My name is Gwen and I want to write a book.";

export default function TestCreationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    setLogs([]);

    if (!user) {
        const errorMsg = "PERMISSION ERROR: You must be logged in to run this test. Firestore security rules require an authenticated user to create projects.";
        addLog(errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        toast({
            variant: "destructive",
            title: "Test Failed",
            description: "Please log in and try again.",
        });
        return;
    }

    try {
      // Step 1: Create the project shell, which is what the dialog now does.
      addLog("STEP 1: Starting Project Shell Creation...");
      addLog(` -> Initial Goal: "${MOCK_INITIAL_GOAL}"`);
      addLog(` -> Granularity: low`);
      
      const projectId = await createProjectShell(
        user,
        {
          initialGoal: MOCK_INITIAL_GOAL,
          granularity: 'low',
        }
      );
      addLog(` -> Project Shell Creation SUCCESS. New Project ID: ${projectId}`);
      
      // Step 2: Trigger the background generation process, which is what the project page now does.
      addLog("STEP 2: Triggering AI plan generation (this may take a moment)...");
      // Note: In the real app, this happens on the project page. We call it directly here to complete the test.
      await generateProjectPlan(projectId);
      addLog(` -> AI plan generation complete for project ${projectId}. Check your project list.`);

      addLog("--- TEST COMPLETED SUCCESSFULLY! ---");
      toast({
        title: "Test Successful!",
        description: `Mock project created and tasks generated with ID: ${projectId}`,
      });

    } catch (e: any) {
      const errorMessage = e.message || "An unknown error occurred.";
      addLog(`--- TEST FAILED: ${errorMessage} ---`);
      console.error("Test failed with error object:", e);
      setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Test Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Creation Test Stage</CardTitle>
            <CardDescription>
              This page runs a full, automated "dress rehearsal" of the new, two-step project creation process. It first creates a project shell, then triggers the AI to generate the plan, mimicking the user workflow without UI interaction. Open your browser's developer console (F12) for detailed logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button size="lg" onClick={handleRunTest} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Play className="mr-2 h-5 w-5" />
              )}
              Run Creation Test
            </Button>
            {error && (
                <div className="text-destructive font-medium p-4 bg-destructive/10 rounded-md w-full flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5"/>
                    <div>
                        <p>Test Failed:</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Rehearsal Log</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full rounded-md border bg-muted/50">
                    <pre className="p-4 text-xs font-mono">
                        {logs.length > 0 ? logs.join('\n') : "Click the button to start the test..."}
                    </pre>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
