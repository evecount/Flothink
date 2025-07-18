
'use server';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { goalClarification } from '@/ai/flows/goal-clarification';
import { addTasksToProject } from './firestore';
import type { Project } from './types';

/**
 * Orchestrates the full AI-driven generation of a project plan.
 * Fetches the project, calls the AI to generate details and tasks,
 * and then saves everything back to Firestore.
 * @param projectId The ID of the project to process.
 */
export async function generateProjectPlan(projectId: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized.");
  }

  const projectRef = doc(db, 'projects', projectId);

  try {
    console.log(`[Generator] Starting plan generation for project: ${projectId}`);
    
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error("Project not found.");
    }
    const project = projectSnap.data() as Project;

    // Call the AI to get the full project plan
    console.log(`[Generator] Calling AI for goal: "${project.initialGoal}"`);
    const result = await goalClarification({
      initialGoal: project.initialGoal,
      granularity: project.granularity,
    });

    if (!result.isComplete || !result.projectName || !result.refinedGoal || !result.projectCategory || !result.tasks) {
        // Adding a check for an empty project name, which can happen with simple goals.
        if (result.isComplete && !result.projectName) {
            console.warn("[Generator] AI returned complete but with no project name. Using initial goal as fallback.");
            result.projectName = project.initialGoal.substring(0, 50); // Use a substring as a fallback name.
        } else {
            throw new Error("AI failed to return a complete project plan. Missing required fields.");
        }
    }
    
    const { projectName, refinedGoal, projectCategory, tasks } = result;
    
    // First, update the project document with the AI-generated details
    console.log(`[Generator] Updating project shell with AI details. Name: ${projectName}`);
    await updateDoc(projectRef, {
        name: projectName,
        refinedGoal: refinedGoal,
        category: projectCategory,
    });
    
    // Now, add all the generated tasks and subtasks in a robust batch
    console.log(`[Generator] Adding ${tasks.length} tasks to project.`);
    await addTasksToProject(projectId, project.ownerUid, tasks);
    
    // Finally, mark the project as fully in progress
    await updateDoc(projectRef, {
        status: 'in_progress',
    });
    
    console.log(`[Generator] Successfully generated and saved plan for project: ${projectId}`);

  } catch (error: any) {
    console.error(`[Generator] CRITICAL ERROR for project ${projectId}:`, error);
    // Mark the project as failed so the UI can show an error
    await updateDoc(projectRef, {
      status: 'generation_failed',
    }).catch(e => console.error(`[Generator] Failed to update project status to failed:`, e));

    // Re-throw the error to be caught by the client-side caller
    throw error;
  }
}
