
'use server';
/**
 * @fileOverview AI flow for suggesting subtopics for a course module.
 *
 * - suggestModuleSubtopics - A function to suggest subtopics.
 * - SuggestModuleSubtopicsInput - The input type.
 * - SuggestModuleSubtopicsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestModuleSubtopicsInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the course module.'),
  moduleDescription: z.string().optional().describe('A brief description of the module content (if available).'),
  courseTopic: z.string().optional().describe('The overall topic of the course for context.'),
  numberOfSuggestions: z.number().default(5).describe('The desired number of subtopic suggestions.'),
});
export type SuggestModuleSubtopicsInput = z.infer<typeof SuggestModuleSubtopicsInputSchema>;

const SuggestModuleSubtopicsOutputSchema = z.object({
  subtopics: z.array(z.string()).describe('An array of suggested subtopics for the module.'),
});
export type SuggestModuleSubtopicsOutput = z.infer<typeof SuggestModuleSubtopicsOutputSchema>;

export async function suggestModuleSubtopics(input: SuggestModuleSubtopicsInput): Promise<SuggestModuleSubtopicsOutput> {
  return suggestModuleSubtopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestModuleSubtopicsPrompt',
  input: {schema: SuggestModuleSubtopicsInputSchema},
  output: {schema: SuggestModuleSubtopicsOutputSchema},
  prompt: `You are an expert curriculum designer. Based on the provided module title and optional description and course topic, suggest relevant subtopics.

Module Title: {{{moduleTitle}}}
{{#if moduleDescription}}
Module Description: {{{moduleDescription}}}
{{/if}}
{{#if courseTopic}}
Course Topic: {{{courseTopic}}}
{{/if}}

Please suggest {{{numberOfSuggestions}}} distinct subtopics that would logically fit within this module.
Each subtopic should be concise and clearly define a specific area of study within the module.
Return the subtopics as an array of strings.
`,
});

const suggestModuleSubtopicsFlow = ai.defineFlow(
  {
    name: 'suggestModuleSubtopicsFlow',
    inputSchema: SuggestModuleSubtopicsInputSchema,
    outputSchema: SuggestModuleSubtopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
