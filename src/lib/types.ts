
import type { Timestamp, FieldValue } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type ProjectStatus = "generating_tasks" | "generation_failed" | "in_progress" | "completed" | "archived";

export interface Source {
  name: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  ownerUid: string;
  initialGoal: string;
  granularity: 'high' | 'medium' | 'low';
  refinedGoal: string;
  status: ProjectStatus;
  createdAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
  sources?: Source[];
}

export interface MicroStep {
  id: string;
  description: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  projectID: string;
  ownerUid: string;
  description: string;
  act: string;
  category: string;
  easeOfCompletionScore: number;
  prerequisites: string[];
  isBlocked: boolean;
  isCompleted: boolean;
  attachmentUrl?: string | null;
  learningObjective?: string | null;
  createdAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
  subTasks: MicroStep[];
}
