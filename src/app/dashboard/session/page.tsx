
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, deleteField, getDoc } from 'firebase/firestore';
import type { Task as AppTask, Project as AppProject, Source } from '@/lib/types';
import { orchestrateTasks, type TaskInput } from '@/ai/flows/task-orchestration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Timer, PartyPopper, Film, Lightbulb, Wind, Play } from 'lucide-react';
import { TaskCard } from '@/components/dashboard/task-card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type SessionStep = 'select_time' | 'in_progress' | 'consolidation' | 'summary';
type ConsolidationSubStep = 'replay' | 'predict' | 'rest';

const timeOptions = [
  { name: 'Quick Sprint', minutes: 15 },
  { name: 'Focus Block', minutes: 30 },
  { name: 'Deep Work', minutes: 45 },
  { name: 'Power Hour', minutes: 60 },
];

export default function SessionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<SessionStep>('select_time');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timeBox, setTimeBox] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [orchestratedTasks, setOrchestratedTasks] = useState<AppTask[]>([]);
  const [originalOrchestratedTasks, setOriginalOrchestratedTasks] = useState<AppTask[]>([]);
  const [sessionSummary, setSessionSummary] = useState('');
  const [completedInSession, setCompletedInSession] = useState<string[]>([]);
  
  const [consolidationStep, setConsolidationStep] = useState<ConsolidationSubStep>('replay');
  const [predictionText, setPredictionText] = useState('');

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if ((step !== 'in_progress' && step !== 'consolidation') || timeLeft <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => {
      clearInterval(timerId);
      if (timeLeft - 1 <= 0) {
        if (step === 'in_progress') {
          setStep('consolidation');
          setConsolidationStep('replay');
          setTimeLeft(40); // 40-second replay
        } else if (step === 'consolidation') {
          if (consolidationStep === 'replay') {
            setConsolidationStep('predict');
          } else if (consolidationStep === 'rest') {
            setStep('summary');
          }
        }
      }
    };
  }, [step, timeLeft, consolidationStep]);


  const startSession = useCallback(async (minutes: number) => {
    if (!user || !db) return;
    setIsLoading(true);
    setError(null);
    setTimeBox(minutes);

    try {
      // 1. Fetch all projects the user is a member of.
      const projectsQuery = query(collection(db, 'projects'), where('ownerUid', '==', user.uid));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppProject));
      setProjects(projectsData);

      const projectIds = projectsSnapshot.docs.map(doc => doc.id);

      if (projectIds.length === 0) {
        setError("No projects found. Create a new project to get started.");
        setIsLoading(false);
        return;
      }
      
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('projectID', 'in', projectIds),
        where('isCompleted', '==', false)
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);

      const allTasks: AppTask[] = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppTask));

      if (allTasks.length === 0) {
        setError("No available tasks in any of your projects. Add tasks to get started.");
        setIsLoading(false);
        return;
      }
      
      // Aggregate all unique sources from all relevant projects
      const allSources: Source[] = [];
      const sourceUrls = new Set<string>();

      projectsSnapshot.docs.forEach(projectSnap => {
          const project = projectSnap.data() as AppProject;
          if (project.sources) {
              project.sources.forEach(source => {
                  if (!sourceUrls.has(source.url)) {
                      allSources.push(source);
                      sourceUrls.add(source.url);
                  }
              });
          }
      });
      
      const aiInput: TaskInput[] = allTasks.map(t => ({
          id: t.id,
          projectID: t.projectID,
          description: t.description,
          act: t.act,
          category: t.category,
          easeOfCompletionScore: t.easeOfCompletionScore,
          attachmentUrl: t.attachmentUrl,
      }));

      // 3. Call the orchestration AI flow
      const { orchestratedTasks: orchestratedResult, sessionSummary } = await orchestrateTasks({
        timeBox: minutes,
        tasks: aiInput,
        sources: allSources,
      });

      // 4. Map AI result back to full AppTask objects from our detailed list
      const orchestratedTaskIds = new Set(orchestratedResult.map(t => t.id));
      const finalTasksWithDetails = allTasks.filter(t => orchestratedTaskIds.has(t.id));
      
      const finalTasksMap = new Map(finalTasksWithDetails.map(t => [t.id, t]));
      const orderedFinalTasks = orchestratedResult.map(t => finalTasksMap.get(t.id)!).filter(Boolean);

      setOrchestratedTasks(orderedFinalTasks);
      setOriginalOrchestratedTasks(orderedFinalTasks);
      setSessionSummary(sessionSummary);
      setTimeLeft(minutes * 60);
      setCompletedInSession([]);
      setStep('in_progress');

    } catch (e: any)
    {
      console.error("Failed to start session:", e);
      setError(e.message || "An unexpected error occurred while setting up your session.");
      toast({
        variant: "destructive",
        title: "Session Start Failed",
        description: e.message || "Please check console for details."
      })
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    if (!db) return;
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      isCompleted,
      completedAt: isCompleted ? serverTimestamp() : deleteField(),
    });

    setOrchestratedTasks(prevTasks =>
      prevTasks.map(t => (t.id === taskId ? { ...t, isCompleted } : t))
    );

    if (isCompleted) {
      if (!completedInSession.includes(taskId)) {
        setCompletedInSession(prev => [...prev, taskId]);
      }
    } else {
      setCompletedInSession(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSubTaskToggle = async (taskId: string, subTaskId: string, isCompleted: boolean) => {
    if (!db) return;
    
    const taskRef = doc(db, 'tasks', taskId);
    
    // Optimistically update local state first
    let parentTask: AppTask | undefined;
    const newOrchestratedTasks = orchestratedTasks.map(t => {
      if (t.id !== taskId) return t;
      const newSubTasks = t.subTasks.map(st => st.id === subTaskId ? { ...st, isCompleted } : st);
      parentTask = { ...t, subTasks: newSubTasks };
      return parentTask;
    });
    setOrchestratedTasks(newOrchestratedTasks);

    // Then update firestore
    if (parentTask) {
        const allSubTasksCompleted = parentTask.subTasks.every(st => st.isCompleted);
        const parentCompletionStatusChanged = parentTask.isCompleted !== allSubTasksCompleted;

        await updateDoc(taskRef, {
            subTasks: parentTask.subTasks,
            ...(parentCompletionStatusChanged && { 
                isCompleted: allSubTasksCompleted,
                completedAt: allSubTasksCompleted ? serverTimestamp() : deleteField()
            })
        });
        
        if (parentCompletionStatusChanged) {
             setOrchestratedTasks(tasks => tasks.map(t => t.id === taskId ? {...t, isCompleted: allSubTasksCompleted} : t));
             if (allSubTasksCompleted) {
                 if (!completedInSession.includes(taskId)) {
                    setCompletedInSession(prev => [...prev, taskId]);
                 }
             } else {
                 setCompletedInSession(prev => prev.filter(id => id !== taskId));
             }
        }
    }
  };

  const handleProceedFromPrediction = () => {
    setConsolidationStep('rest');
    setTimeLeft(60); // 1-minute rest
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const remainingTasks = originalOrchestratedTasks.filter(task => !completedInSession.includes(task.id));

  if (authLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 lg:p-8">
       <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        {step === 'select_time' && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Start a Focused Session</CardTitle>
                    <CardDescription>Select your available time. The AI will create a focused batch of tasks for you to tackle from all your projects.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-8 pt-4">
                    <div>
                        <h3 className="mb-4 font-headline text-xl font-semibold text-center">Time Box</h3>
                        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
                            {timeOptions.map(option => (
                                <Button 
                                    key={option.name} 
                                    size="lg" 
                                    className="h-24 flex-col text-lg" 
                                    onClick={() => startSession(option.minutes)} 
                                    disabled={isLoading}
                                >
                                    <span>{option.name}</span>
                                    <span className="text-2xl font-bold">{option.minutes} min</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                     {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                     {error && <p className="text-destructive">{error}</p>}
                </CardContent>
            </Card>
        )}

        {step === 'in_progress' && (
            <div>
                <Card className="mb-8 text-center">
                    <CardHeader>
                        <CardTitle className="font-mono text-6xl font-bold text-primary">{formatTime(timeLeft)}</CardTitle>
                        <CardDescription className="text-base">{sessionSummary}</CardDescription>
                    </CardHeader>
                </Card>
                <h2 className="mb-4 font-headline text-2xl font-semibold">Your Focused Task Batch</h2>
                {orchestratedTasks.every(t => t.isCompleted) ? (
                    <Card className="flex flex-col items-center justify-center p-8 text-center">
                      <PartyPopper className="h-12 w-12 text-primary mb-4"/>
                      <CardTitle className="font-headline text-2xl">Scene Clear!</CardTitle>
                      <CardDescription>Excellent work! You've completed all tasks for this session.</CardDescription>
                      <Button onClick={() => setStep('summary')} className="mt-4">
                        See Summary
                      </Button>
                    </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {orchestratedTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            projectName={projectMap.get(task.projectID)}
                            onTaskToggle={handleTaskToggle} 
                            onSubTaskToggle={handleSubTaskToggle}
                          />
                      ))}
                  </div>
                )}
            </div>
        )}
        
        {step === 'consolidation' && (
           <Card>
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                    {consolidationStep === 'replay' && <Film className="h-10 w-10 text-primary" />}
                    {consolidationStep === 'predict' && <Lightbulb className="h-10 w-10 text-primary" />}
                    {consolidationStep === 'rest' && <Wind className="h-10 w-10 text-primary" />}
                </div>
                <CardTitle className="font-headline text-3xl">
                    {consolidationStep === 'replay' && "The Director's Cut"}
                    {consolidationStep === 'predict' && "Set the Next Scene"}
                    {consolidationStep === 'rest' && "Take a Bow"}
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                {consolidationStep === 'replay' && (
                    <>
                        <p className="text-lg text-muted-foreground">Take the next 40 seconds to mentally replay your performance. What did you learn? What went well? What was a key insight?</p>
                        <p className="font-mono text-5xl font-bold text-primary mt-6">{formatTime(timeLeft)}</p>
                    </>
                )}
                {consolidationStep === 'predict' && (
                    <>
                       <p className="text-lg text-muted-foreground mb-4">To ensure the story continues, what is the single most important action or intention you will carry forward from this session?</p>
                       <Textarea 
                            placeholder="e.g., Follow up with the design team about the new mockups..."
                            value={predictionText}
                            onChange={(e) => setPredictionText(e.target.value)}
                            rows={3}
                       />
                       <Button size="lg" className="mt-6" onClick={handleProceedFromPrediction}>Save & Continue</Button>
                    </>
                )}
                {consolidationStep === 'rest' && (
                    <>
                        <p className="text-lg text-muted-foreground">Bravo! Now, take a brief 1-minute intermission. Close your eyes, breathe, and let the work settle. No need to think, just rest.</p>
                        <p className="font-mono text-5xl font-bold text-primary mt-6">{formatTime(timeLeft)}</p>
                    </>
                )}
            </CardContent>
           </Card>
        )}

        {step === 'summary' && (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <PartyPopper className="h-10 w-10 text-primary"/>
              </div>
              <CardTitle className="font-headline text-3xl">Curtain Call!</CardTitle>
              <CardDescription className="max-w-prose mx-auto">
                Bravo! A stellar performance. You completed {completedInSession.length} task(s). The audience demands an encore, but even the best actors need an intermission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setStep('select_time')}>Start Another Session</Button>
               {remainingTasks.length > 0 && (
                <div className="mt-8">
                    <Separator className="my-6" />
                    <h3 className="text-xl font-headline font-semibold">What's Next on the Call Sheet?</h3>
                    <p className="text-muted-foreground text-center mb-4 mt-2">The curtain fell before these scenes were rehearsed. You can still complete them now.</p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-left pt-4">
                      {remainingTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            projectName={projectMap.get(task.projectID)}
                            onTaskToggle={handleTaskToggle} 
                            onSubTaskToggle={handleSubTaskToggle}
                          />
                      ))}
                    </div>
                </div>
            )}
            </CardContent>
          </Card>
        )}
       </div>
    </main>
  );
}
