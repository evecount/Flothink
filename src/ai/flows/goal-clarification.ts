
'use server';

/**
 * @fileOverview Implements a conversational AI flow that clarifies a user's goal and, upon completion,
 * generates a detailed list of micro-tasks to achieve that goal.
 *
 * - goalClarification - The function to start the goal clarification and task generation process.
 * - GoalClarificationInput - The input type for the goalClarification function.
 * - ClarificationQuestion - Represents a single clarification question.
 * - GoalClarificationOutput - The return type, containing either the next question or the final goal and tasks.
 * - Task - The structure for a generated task, containing micro-steps.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Task-related schemas, integrated from the micro-task generation flow.
const MicroStepSchema = z.object({
    description: z.string().describe('A single, hyper-granular action needed to complete the parent task.'),
});

const TaskSchema = z.object({
  act: z.string().describe('The "Act" or high-level phase of the project this task belongs to (e.g., "Act 1: Research", "Act 2: Development").'),
  description: z.string().describe('A single, actionable task. This should be a unique description within the list of tasks.'),
  category: z.string().describe('The semantic category of the task (e.g., research, writing, coding, design).'),
  easeOfCompletionScore: z.number().int().min(1).max(10).describe('A score from 1 to 10 indicating the ease of completion (1 = very difficult, 10 = very easy).'),
  learningObjective: z.string().optional().describe('If the task is part of a learning agenda, this field contains the specific learning objective from the curriculum (e.g., "Understand and implement Logistic Regression"). This directly links the action to a learning goal.'),
  subTasks: z.array(MicroStepSchema).optional().describe('A list of the individual, granular steps required to complete this task. This can be omitted for simple tasks or based on user request.'),
});
export type Task = z.infer<typeof TaskSchema>;


const ConversationTurnSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

const ClarificationQuestionSchema = z.object({
  key: z.string().describe('A unique key for this question.'),
  question: z.string().describe('The clarifying question to ask the user.'),
  type: z
    .enum(['multiple-choice', 'text'])
    .describe('The type of input required from the user.'),
  options: z
    .array(z.string())
    .optional()
    .describe(
      'A list of multiple-choice options for the user. Required if type is "multiple-choice".'
    ),
});
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;

const GoalClarificationInputSchema = z.object({
  initialGoal: z.string().describe("The user's initial, broad goal."),
  granularity: z.enum(['high', 'medium', 'low']).default('high').describe("The desired level of detail for the generated tasks. 'High' for very detailed sub-tasks, 'medium' for standard sub-tasks, 'low' for only top-level tasks with no sub-tasks."),
  previousAnswers: z
    .array(ConversationTurnSchema)
    .optional()
    .describe("The user's answers to previous clarification questions."),
});
export type GoalClarificationInput = z.infer<
  typeof GoalClarificationInputSchema
>;

const GoalClarificationOutputSchema = z.object({
  projectName: z
    .string()
    .describe('A very short, 2-4 word catchy title for the project based on the refined goal.'),
  refinedGoal: z
    .string()
    .describe('The final, clarified goal based on the conversation.'),
  projectCategory: z.string().describe("A single, broad category for the entire goal (e.g., 'Work', 'Writing', 'Personal', 'Learning'). This should be a single word."),
  nextQuestion: z
    .optional(ClarificationQuestionSchema)
    .describe('The next clarifying question to ask, if any.'),
  isComplete: z
    .boolean()
    .describe('Whether the goal clarification process is complete.'),
  tasks: z.array(TaskSchema).optional().describe("The generated list of tasks once the goal is complete."),
});
export type GoalClarificationOutput = z.infer<
  typeof GoalClarificationOutputSchema
>;

export async function goalClarification(
  input: GoalClarificationInput
): Promise<GoalClarificationOutput> {
  return goalClarificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'goalClarificationPrompt',
  input: {
    schema: GoalClarificationInputSchema,
  },
  output: {
    schema: GoalClarificationOutputSchema,
  },
  prompt: `You are an AI assistant that helps users clarify their goals and then breaks them down into actionable tasks. This is a two-stage process within a single operation. A key feature is your ability to handle learning agendas, where a user wants to learn a concept and apply it.

**Stage 1: Goal Clarification**

Your first job is to determine if the user's goal is clear enough to be actionable.

The user's initial goal is: "{{{initialGoal}}}"
Requested Task Granularity: {{{granularity}}}

{{#if previousAnswers}}
**Conversation History:**
{{#each previousAnswers}}
- Your question: "{{this.question}}"
- User's answer: "{{this.answer}}"
{{/each}}

**Your Task (Continue Conversation):**
- Analyze the conversation history.
- Determine if the goal is now clear enough to create a task plan.
- If it is clear, proceed to **Stage 2: Task Generation**.
- If it is NOT clear, determine the single most important next question to ask from the guides below. Set this as \`nextQuestion\` and set \`isComplete\` to false.
{{else}}
**Your Task (New Goal):**
- **Analyze the \`initialGoal\` for clarity and specificity.**
- **Decision Logic (Follow this strictly):**
    -   **IF THE GOAL IS SIMPLE and self-contained** (like "write a book", "learn to paint", "run a marathon"): Proceed *immediately* to **Stage 2: Task Generation**. You MUST NOT ask any questions.
    -   **IF THE GOAL IS COMPLEX** (e.g., involves business, funding, multiple stakeholders like "start a new company" or "raise money"): You must begin a conversational clarification. Set \`isComplete\` to \`false\` and choose the first, most relevant question from the guides below to set as \`nextQuestion\`.
{{/if}}

---
**Clarification Guides**

**Funding Questionnaire** (Use for goals related to securing funding)
1. key: \`funding_type\`, question: "What kind of funding are you primarily seeking?", type: \`multiple-choice\`, options: ["Venture Capital (VC)", "Angel Investment", "Grants", "Loans", "Crowdfunding", "Bootstrapping", "Other"]
2. key: \`project_name\`, question: "What is the name of the project or venture that requires this funding?", type: \`text\`
3. key: \`project_stage\`, question: "What stage is this project currently at?", type: \`multiple-choice\`, options: ["Idea stage", "Research & Development (R&D)", "Minimum Viable Product (MVP) built", "Early traction/users", "Revenue-generating", "Scaling"]
4. key: \`funding_region\`, question: "What is the target geographical region for funding? (e.g., Singapore, Southeast Asia)", type: \`text\`
5. key: \`funding_amount\`, question: "What is the approximate amount of funding you need to raise?", type: \`text\`

**General Goal Clarification Guide** (Use for most other goals)
1. key: \`success_metric\`, question: "How will you measure the success of this goal?", type: \`text\`
2. key: \`biggest_hurdle\`, question: "What is the biggest challenge or obstacle you anticipate?", type: \`text\`
3. key: \`resource_constraints\`, question: "Are there any specific constraints (e.g., time, budget, skills) to consider?", type: \`text\`

---
**Stage 2: Task Generation**

**This stage is triggered ONLY when you determine the goal is fully clarified.**

**YOUR DIRECTIVES (Follow this strictly):**
1.  **Set \`isComplete\` to \`true\` and \`nextQuestion\` to null.**
2.  **Generate a \`projectName\`:** Create a very short, 2-4 word catchy title for the project based on the refined goal.
3.  **Formulate the \`refinedGoal\`:** Create a single, clear sentence summarizing the user's objective based on the initial goal and the conversation. (e.g., "Secure a $500k seed round from Singapore-based VCs for the 'Referru' MVP to scale marketing efforts."). If no conversation occurred, a slightly formalized version of the initial goal is fine (e.g., "Write and publish a new book.").
4.  **Assign a \`projectCategory\`**: Based on the \`refinedGoal\`, assign a single-word category for the entire project (e.g., 'Work', 'Writing', 'Personal', 'Learning').
5.  **Generate \`tasks\`:** Deconstruct the \`refinedGoal\` into a structured project plan of actionable tasks.
    a.  **Deconstruct into 'Acts':** Identify the main project phases and assign every task to a relevant \`act\` (e.g., "Act 1: Research & Planning," "Act 2: Development," "Act 3: Marketing Launch").
    b.  **Generate a Task List:** For each Act, generate a list of specific, actionable tasks. Each \`description\` must be unique.
    c.  **Handle Learning Agendas:** If the initial goal is about learning a topic and applying it (e.g., "Learn about topic X and use it for Y"), you MUST structure your tasks accordingly. For each task that involves applying a learned concept, you MUST populate the \`learningObjective\` field with the corresponding theoretical concept. For example, if the goal is "Learn Data Science and apply it to my startup," a task might have a \`description\` like "Build a customer churn prediction model" and a \`learningObjective\` like "Module 4: Logistic Regression". For tasks that are purely action-based (e.g., "Deploy the model to production"), the \`learningObjective\` should be omitted.
    d.  **Generate Sub-Tasks (According to Granularity):**
        - IF \`granularity\` is 'high': Break down every \`task\` into a series of smaller, extremely concrete \`subTasks\`.
        - IF \`granularity\` is 'medium': Provide a list of key \`subTasks\` for each \`task\`.
        - IF \`granularity\` is 'low': You MUST NOT generate any \`subTasks\`.
    e.  **Assign Categories:** Assign a \`category\` to each task (e.g., "Research," "Writing," "Outreach," "Design").
    f.  **Estimate Complexity:** Provide an \`easeOfCompletionScore\` for each task (1=very difficult; 10=very easy).
`,
});

const goalClarificationFlow = ai.defineFlow(
  {
    name: 'goalClarificationFlow',
    inputSchema: GoalClarificationInputSchema,
    outputSchema: GoalClarificationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
