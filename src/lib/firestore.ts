
import {
  collection,
  serverTimestamp,
  writeBatch,
  doc,
  addDoc,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Project, Task, UserProfile, MicroStep } from './types';
import type { Task as GenkitTask } from '@/ai/flows/goal-clarification';


export async function createProjectShell(
  user: UserProfile,
  projectData: {
    initialGoal: string;
    granularity: 'high' | 'medium' | 'low';
  }
): Promise<string> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot create project.");
  }
  console.log('[Firestore] createProjectShell: Starting...');
  
  const newProject: Omit<Project, 'id'> = {
    // Use the goal as a temporary name until the AI provides a better one.
    name: projectData.initialGoal, 
    initialGoal: projectData.initialGoal,
    granularity: projectData.granularity,
    refinedGoal: '',
    category: '',
    status: 'generating_tasks',
    createdAt: serverTimestamp(),
    ownerUid: user.uid,
    sources: [],
  };

  try {
    const projectRef = await addDoc(collection(db, 'projects'), newProject);
    console.log(`[Firestore] createProjectShell: Shell created with ID: ${projectRef.id}`);
    return projectRef.id;
  } catch (e: any) {
    console.error('[Firestore] createProjectShell CRITICAL ERROR:', e);
    if (e.code === 'permission-denied' || e.message?.includes('PERMISSION_DENIED')) {
      throw new Error(
        `Permission Denied: Your Firestore security rules for project "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}" are blocking project creation. Please ensure you are editing the rules for the correct Firebase project and that they allow writes for authenticated users.`
      );
    }
    throw new Error(`Failed during project shell creation: ${e.message}`);
  }
}

export async function addTasksToProject(
  projectId: string,
  ownerUid: string,
  tasksData: GenkitTask[]
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not initialized. Cannot add tasks.');
  }
  console.log(
    `[Firestore] Starting robust project build for project ${projectId} with ${tasksData.length} main tasks.`
  );
  
  const batch = writeBatch(db);
  
  for (const task of tasksData) {
      const taskRef = doc(collection(db, 'tasks'));
      
      const subTasks: MicroStep[] = (task.subTasks || []).map((st, index) => ({
          id: `${taskRef.id}-${index}`,
          description: st.description,
          isCompleted: false,
      }));

      const newTaskDoc: Omit<Task, 'id'> = {
          projectID: projectId,
          ownerUid: ownerUid,
          description: task.description,
          act: task.act,
          category: task.category,
          easeOfCompletionScore: task.easeOfCompletionScore,
          prerequisites: [],
          isBlocked: false,
          isCompleted: false,
          createdAt: serverTimestamp(),
          attachmentUrl: null,
          learningObjective: task.learningObjective || null,
          subTasks: subTasks,
      };

      batch.set(taskRef, newTaskDoc);
  }

  try {
      await batch.commit();
      console.log(`[Firestore] Batch committed successfully with ${tasksData.length} tasks.`);
  } catch (e: any) {
      console.error(`[Firestore] CRITICAL ERROR during batch commit:`, e);
      throw new Error(`Failed to save tasks to database: ${e.message}`);
  }

  console.log(
    '[Firestore] Robust project build complete. All tasks committed.'
  );
}
