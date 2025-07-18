
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
  getDocs,
  getDoc,
} from 'firebase/firestore';
import type { Task } from '@/lib/types';
import { Loader2, History, PartyPopper } from 'lucide-react';
import { TaskCard } from '@/components/dashboard/task-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CompletedTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedTasks = useCallback(async () => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // 1. Find all projects the user is a member of.
    const projectsQuery = query(
      collection(db, 'projects'),
      where('ownerUid', '==', user.uid)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projectIds = projectsSnapshot.docs.map((doc) => doc.id);

    if (projectIds.length === 0) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // 2. Fetch all completed tasks from those projects.
    // Firestore 'in' query is limited to 30 elements. If a user has more projects, this will need pagination.
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectID', 'in', projectIds),
      where('isCompleted', '==', true)
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) =>
        taskList.push({ id: doc.id, ...doc.data() } as Task)
      );
      taskList.sort((a, b) => {
        const timeA = (a.completedAt as any)?.toMillis() || 0;
        const timeB = (b.completedAt as any)?.toMillis() || 0;
        return timeB - timeA;
      });
      setTasks(taskList);
      setLoading(false);
    });

    return () => {
      unsubscribeTasks();
    };
  }, [user]);
  
  useEffect(() => {
    const unsubscribePromise = fetchCompletedTasks();
    return () => {
        unsubscribePromise?.then(unsub => unsub && unsub());
    }
  }, [fetchCompletedTasks]);


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

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-4xl font-bold text-primary flex items-center gap-3">
                <History className="h-10 w-10"/>
                Curtain Calls
            </CardTitle>
            <CardDescription className="pt-2 text-lg">
                A history of your completed tasks and finest performances.
            </CardDescription>
          </CardHeader>
        </Card>

        {tasks.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <PartyPopper className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="font-headline text-2xl">The Stage is Quiet</CardTitle>
            <CardDescription>
              You have no completed tasks yet. Finish some scenes to see your history here!
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskToggle={handleTaskToggle}
                onSubTaskToggle={handleSubTaskToggle}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
