
'use server';

/**
 * @fileOverview Orchestrates tasks by grouping similar tasks and prioritizing unblocked tasks.
 *
 * - orchestrateTasks - A function that orchestrates tasks for a user.
 * - OrchestrateTasksInput - The input type for the orchestrateTasks function.
 * - OrchestrateTasksOutput - The return type for the orchestrateTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { fetchUrlTool } from '../tools/fetch-url-tool';

const TaskInputSchema = z.object({
  id: z.string().describe('Unique identifier for the task.'),
  projectID: z.string().describe('The project the task belongs to.'),
  description: z.string().describe('Description of the task.'),
  act: z.string().describe('The "Act" or high-level phase of the project this task belongs to (e.g., "Act 1: Research").'),
  category: z.string().describe('Semantic category of the task (e.g., research, writing, coding, design).'),
  easeOfCompletionScore: z.number().describe('A numerical score indicating how easy the task is to complete (1-10).'),
  attachmentUrl: z.string().url().nullable().optional().describe('An optional URL attachment for this task.'),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

const SourceSchema = z.object({
  name: z.string().describe("The name of the source document."),
  url: z.string().url().describe("The URL to the source document."),
});

const OrchestrateTasksInputSchema = z.object({
  timeBox: z.number().describe('The time available for the task orchestration session, in minutes.'),
  tasks: z.array(TaskInputSchema).describe('An array of all available, non-completed tasks to orchestrate from.'),
  sources: z.array(SourceSchema).optional().describe("An optional list of high-level source documents for context."),
});

export type OrchestrateTasksInput = z.infer<typeof OrchestrateTasksInputSchema>;

const OrchestrateTasksOutputSchema = z.object({
  orchestratedTasks: z.array(TaskInputSchema).describe('The list of orchestrated tasks, in the order they should be executed.'),
  sessionSummary: z.string().describe('A summary of the orchestration session, including the logic for why these tasks were grouped.'),
});

export type OrchestrateTasksOutput = z.infer<typeof OrchestrateTasksOutputSchema>;

export async function orchestrateTasks(input: OrchestrateTasksInput): Promise<OrchestrateTasksOutput> {
  return orchestrateTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'orchestrateTasksPrompt',
  input: {schema: OrchestrateTasksInputSchema},
  output: {schema: OrchestrateTasksOutputSchema},
  tools: [fetchUrlTool],
  system: `You are an AI task orchestrator. Your job is to create a focused batch of tasks for a user's work session based on their available time and a list of all available tasks.`,
  prompt: `**Context Documents:**
{{#if sources}}
- Review the content of the following source documents using the 'fetchUrl' tool to understand the project's big picture.
{{#each sources}}
  - **Source:** {{this.name}} ({{this.url}})
{{/each}}
{{else}}
- No source documents provided.
{{/if}}

**Session Context:**
- **Available Time:** {{{timeBox}}} minutes.

**Full List of Available Tasks:**
{{#each tasks}}
- **Task ID:** {{this.id}}
  - **Project ID:** {{this.projectID}}
  - **Description:** {{this.description}}
  - **Act:** {{this.act}}
  - **Category:** {{this.category}}
  - **Complexity Score:** {{this.easeOfCompletionScore}} (1=hard, 10=easy)
  {{#if this.attachmentUrl}}
  - **Attachment:** {{this.attachmentUrl}}
  {{/if}}
{{/each}}

---

**Task Selection Logic (Strictly follow this order):**

**Step 1: Identify Unblocked Tasks (The "Call Sheet")**
- Projects are linear and composed of "Acts" (e.g., "Act 1: Planning", "Act 2: Production"). A task from a later Act (e.g., Act 2) cannot be started until ALL tasks from the previous Act (e.g., Act 1) within the SAME project are complete.
- For each unique \`projectID\` in the task list, determine the lowest Act number that contains incomplete tasks.
- Create a pool of "unblocked" tasks. This pool should ONLY contain tasks from that lowest incomplete Act for each project. All tasks from later acts are considered "blocked" and MUST be excluded from consideration for this session.

**Step 2: Review Context for Unblocked Tasks**
- If any of the unblocked tasks from Step 1 have attachments, use the \`fetchUrl\` tool to read their content.
- Also use the \`fetchUrl\` tool to review the high-level **Context Documents** to understand the project's big picture.

**Step 3: Find the Most Efficient Grouping (From the "Call Sheet" only).**
- Analyze ONLY the "unblocked" tasks identified in Step 1. Your primary goal is to find the most efficient grouping for the user's work session.
- **Priority 1 (Synergy):** Look for unblocked tasks across different projects that share a common theme or skill (e.g., tasks related to "SEO" or "user research"). Grouping these is the top priority.
- **Priority 2 (Project Concentration):** If no synergy exists, focus on a single project by grouping its unblocked tasks.
- **Priority 3 (Category Batching):** If tasks are scattered, batch them by **Category** to minimize context switching.

**Step 4: Prioritize Easy Wins.**
- Take the group of tasks selected in Step 3.
- Sort them by \`easeOfCompletionScore\` in **descending order (10 down to 1)**.

**Step 5: Create the Final Task Batch.**
- From your sorted list, select a realistic number of tasks that can be completed in the \`{{{timeBox}}}\` minute window.
- Use this as a rough guide for timing:
    - Ease 8-10: ~5-15 mins
    - Ease 5-7: ~15-30 mins
    - Ease 1-4: ~30-60+ mins
- A shorter, achievable list is better than an overwhelming one.

**Final Output:**
- Populate the \`orchestratedTasks\` array with the final, ordered list of tasks for the session. Ensure you include all required fields for each task, including \`projectID\` and \`act\`.
- Write a brief, direct \`sessionSummary\` explaining your grouping logic from Step 3. For example: "I've batched together your design and writing tasks for maximum creative flow."
`,
});

const orchestrateTasksFlow = ai.defineFlow(
  {
    name: 'orchestrateTasksFlow',
    inputSchema: OrchestrateTasksInputSchema,
    outputSchema: OrchestrateTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
