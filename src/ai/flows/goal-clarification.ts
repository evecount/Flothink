export type Task = {
  title: string;
  description: string;
  act: string;
  microSteps: { title: string; isCompleted?: boolean }[];
  estimatedTime?: number;
};

export type ConversationTurn = {
  role: 'user' | 'model';
  content: string;
};

export type ClarificationQuestion = {
  question: string;
  options?: string[];
};

export type GoalClarificationInput = {
  initialGoal: string;
  granularity: 'high' | 'medium' | 'low';
  conversationHistory?: ConversationTurn[];
};

export type GoalClarificationOutput = {
  isComplete: boolean;
  projectName?: string;
  refinedGoal?: string;
  projectCategory?: string;
  clarificationQuestions?: ClarificationQuestion[];
  tasks?: Task[];
};

export async function goalClarification(
  input: GoalClarificationInput
): Promise<GoalClarificationOutput> {
  return {
    isComplete: true,
    projectName: input.initialGoal.slice(0, 50) || 'New Production',
    refinedGoal: input.initialGoal,
    projectCategory: 'Production',
    tasks: [
      {
        title: 'Define Core Scene & Scope',
        description: `Clarify milestones for: ${input.initialGoal}`,
        act: 'Act 1 · Setup',
        microSteps: [{ title: 'List 3 key deliverables', isCompleted: false }],
        estimatedTime: 15,
      },
    ],
  };
}
