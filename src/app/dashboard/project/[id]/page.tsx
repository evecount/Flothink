
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  deleteField,
  getDoc,
  writeBatch,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import type { Task, Project } from '@/lib/types';
import { generateProjectPlan } from '@/lib/project-generator';
import { Loader2, ArrowLeft, Plus, FileText, Play, Sparkles, AlertTriangle, Pencil, MoreVertical, Trash2 } from 'lucide-react';
import { TaskCard } from '@/components/dashboard/task-card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NewActDialog } from '@/components/dashboard/new-act-dialog';
import { AddSourceDialog } from '@/components/dashboard/add-source-dialog';
import { EditProjectDialog } from '@/components/dashboard/edit-project-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();

  const triggerTaskGeneration = useCallback(async (id: string) => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      await generateProjectPlan(id);
      // The onSnapshot listener will handle the UI updates automatically.
      toast({
        title: "Tasks Generated!",
        description: "Your project plan is ready.",
      });
    } catch (e: any) {
      console.error("Failed to generate project plan:", e);
      setGenerationError(e.message || "An unknown error occurred during task generation.");
      // The project status will be updated to 'generation_failed' by the server action
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !db) {
        setLoading(false);
        return;
    }

    const projectRef = doc(db, 'projects', projectId);
    const unsubscribeProject = onSnapshot(projectRef, (doc) => {
      if (doc.exists() && doc.data().ownerUid === user.uid) {
        const projectData = { id: doc.id, ...doc.data() } as Project;
        setProject(projectData);
        if (projectData.status === 'generating_tasks' && !isGenerating) {
            triggerTaskGeneration(projectData.id);
        }
      } else {
        setProject(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching project:", error);
        setProject(null);
        setLoading(false);
    });
    
    const tasksQuery = query(collection(db, 'tasks'), where('projectID', '==', projectId));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach(doc => taskList.push({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskList.sort((a,b) => (a.createdAt as any) - (b.createdAt as any) ).sort((a, b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1) ));
    });

    return () => {
      unsubscribeProject();
      unsubscribeTasks();
    };
  }, [user, projectId, isGenerating, triggerTaskGeneration]);

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    if (!db) return;
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { 
      isCompleted,
      completedAt: isCompleted ? serverTimestamp() : deleteField(),
     });
  };

  const handleSubTaskToggle = async (taskId: string, subTaskId: string, isCompleted: boolean) => {
    if (!db) return;
    
    const taskRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) return;

    const taskData = taskSnap.data() as Task;
    const newSubTasks = taskData.subTasks.map(st => 
        st.id === subTaskId ? { ...st, isCompleted } : st
    );

    const allSubTasksCompleted = newSubTasks.every(st => st.isCompleted);
    
    await updateDoc(taskRef, {
        subTasks: newSubTasks,
        isCompleted: allSubTasksCompleted,
        completedAt: allSubTasksCompleted ? serverTimestamp() : deleteField()
    });
  };
  
  const handleDeleteProject = async () => {
    if (!db || !project) return;
    setIsDeleting(true);
    try {
        const batch = writeBatch(db);

        // 1. Delete all tasks for the project
        const tasksQuery = query(collection(db, 'tasks'), where('projectID', '==', project.id));
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 2. Delete the project itself
        const projectRef = doc(db, 'projects', project.id);
        batch.delete(projectRef);

        await batch.commit();

        toast({
            title: 'Project Deleted',
            description: `"${project.name}" and all its tasks have been removed.`,
        });

        router.push('/dashboard');
    } catch (error: any) {
        console.error('Failed to delete project:', error);
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message || 'Could not delete the project.',
        });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.isCompleted).length;
    return (completedTasks / tasks.length) * 100;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
        <h2 className="font-headline text-2xl font-bold">Project not found</h2>
        <p className="text-muted-foreground">This project does not exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/dashboard"><ArrowLeft className="mr-2"/> Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (project.status === 'generating_tasks' || project.status === 'generation_failed') {
      return (
        <main className="flex flex-1 items-center justify-center p-4 lg:p-8">
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        {isGenerating || project.status === 'generating_tasks' ? <Sparkles className="h-12 w-12 text-primary animate-pulse" /> : <AlertTriangle className="h-12 w-12 text-destructive"/> }
                    </div>
                    <CardTitle className="mt-6 font-headline text-3xl font-bold">
                        {project.status === 'generating_tasks' ? "Producer at Work..." : "Generation Failed"}
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {project.status === 'generating_tasks' ? "Our AI is drafting the script for your project. The task list will appear here automatically when it's ready." : "There was an error generating the tasks for this project."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {(isGenerating || project.status === 'generating_tasks') && <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary"/>}
                        {generationError && <p className="text-destructive-foreground bg-destructive p-3 rounded-md">{generationError}</p>}
                        {project.status === 'generation_failed' && (
                            <div className="flex justify-center items-center gap-4">
                                <Button onClick={() => triggerTaskGeneration(project.id)} disabled={isGenerating} className="mt-6">
                                    {isGenerating ? "Generating..." : "Retry Generation"}
                                </Button>
                                <EditProjectDialog project={project}>
                                     <Button variant="outline" className="mt-6">
                                        <Pencil className="mr-2 h-4 w-4"/>
                                        Edit Goal
                                     </Button>
                                </EditProjectDialog>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </main>
      )
  }


  return (
    <main className="p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-4xl font-bold text-primary">{project.name}</CardTitle>
                        <CardDescription className="pt-2 text-lg">
                            {project.refinedGoal || project.initialGoal}
                        </CardDescription>
                         <CardDescription className="pt-2 text-base">
                            Category: <span className="font-semibold">{project.category}</span>
                        </CardDescription>
                    </div>
                    {user && (
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" asChild>
                                <Link href="/dashboard/session">
                                    <Play className="mr-2 h-4 w-4 fill-current" />
                                    Start Session
                                </Link>
                            </Button>
                            <AddSourceDialog projectId={project.id} />
                            <NewActDialog projectId={project.id}>
                                <Button>
                                    <Plus className="mr-2" />
                                    Add New Act
                                </Button>
                            </NewActDialog>
                            <AlertDialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <EditProjectDialog project={project}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>Edit &amp; Regenerate...</span>
                                    </DropdownMenuItem>
                                  </EditProjectDialog>
                                  <DropdownMenuSeparator />
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Delete Project</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    project <span className="font-bold">"{project.name}"</span> and all of its associated tasks.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteProject}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Yes, delete project
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            </CardHeader>
        </Card>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-3 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={progress} className="h-3" />
                  <span className="font-mono text-lg font-medium text-primary">{Math.round(progress)}%</span>
                </div>
              </CardContent>
            </Card>
            
            {project.sources && project.sources.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Project Sources</CardTitle>
                        <CardDescription>
                            The "Everything Notebook" for this project. These documents provide context to the AI.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {project.sources.map(source => (
                                <li key={source.url} className="flex items-center justify-between rounded-md border p-3">
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:underline">
                                        <FileText className="h-5 w-5" />
                                        <span className="font-medium">{source.name}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-headline text-2xl font-semibold">Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onTaskToggle={handleTaskToggle} 
                onSubTaskToggle={handleSubTaskToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
