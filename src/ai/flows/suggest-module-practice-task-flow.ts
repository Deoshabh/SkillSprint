
'use server';
/**
 * @fileOverview AI flow for suggesting a practice task for a course module.
 *
 * - suggestModulePracticeTask - A function to suggest a practice task.
 * - SuggestModulePracticeTaskInput - The input type.
 * - SuggestModulePracticeTaskOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestModulePracticeTaskInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the course module.'),
  moduleDescription: z.string().optional().describe('A brief description of the module content.'),
  subtopics: z.array(z.string()).optional().describe('A list of subtopics covered in the module.'),
  courseTopic: z.string().optional().describe('The overall topic of the course for context.'),
});
export type SuggestModulePracticeTaskInput = z.infer<typeof SuggestModulePracticeTaskInputSchema>;

const SuggestModulePracticeTaskOutputSchema = z.object({
  practiceTask: z.string().describe('A suggested practice task or project for the module.'),
});
export type SuggestModulePracticeTaskOutput = z.infer<typeof SuggestModulePracticeTaskOutputSchema>;

export async function suggestModulePracticeTask(input: SuggestModulePracticeTaskInput): Promise<SuggestModulePracticeTaskOutput> {
  return suggestModulePracticeTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestModulePracticeTaskPrompt',
  input: {schema: SuggestModulePracticeTaskInputSchema},
  output: {schema: SuggestModulePracticeTaskOutputSchema},
  prompt: `You are an expert instructional designer. Based on the provided module information, suggest a practical and engaging practice task or mini-project.

Module Title: {{{moduleTitle}}}
{{#if moduleDescription}}
Module Description: {{{moduleDescription}}}
{{/if}}
{{#if subtopics.length}}
Subtopics:
{{#each subtopics}}
- {{{this}}}
{{/each}}
{{/if}}
{{#if courseTopic}}
Course Topic: {{{courseTopic}}}
{{/if}}

The practice task should allow learners to apply the concepts taught in the module. It should be actionable and clearly defined.
Return a single string describing the task.
Example: "Build a small component that fetches data from an API and displays it."
`,
});

const suggestModulePracticeTaskFlow = ai.defineFlow(
  {
    name: 'suggestModulePracticeTaskFlow',
    inputSchema: SuggestModulePracticeTaskInputSchema,
    outputSchema: SuggestModulePracticeTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
