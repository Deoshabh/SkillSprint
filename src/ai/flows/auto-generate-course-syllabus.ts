// src/ai/flows/auto-generate-course-syllabus.ts
'use server';
/**
 * @fileOverview AI flow for automatically generating a course syllabus and module breakdowns.
 *
 * - autoGenerateCourseSyllabus - A function to generate the course syllabus.
 * - AutoGenerateCourseSyllabusInput - The input type for the autoGenerateCourseSyllabus function.
 * - AutoGenerateCourseSyllabusOutput - The return type for the autoGenerateCourseSyllabus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoGenerateCourseSyllabusInputSchema = z.object({
  courseTopic: z.string().describe('The topic of the course for which to generate the syllabus.'),
  targetAudience: z.string().describe('The target audience for the course (e.g., beginners, intermediate learners).'),
  learningObjectives: z.string().describe('A comma-separated list of the main learning objectives for the course.'),
  desiredNumberOfModules: z.number().describe('The desired number of modules for the course.'),
});
export type AutoGenerateCourseSyllabusInput = z.infer<typeof AutoGenerateCourseSyllabusInputSchema>;

const AutoGenerateCourseSyllabusOutputSchema = z.object({
  courseSyllabus: z.string().describe('A detailed course syllabus including module breakdowns, topics, and learning activities.'),
});
export type AutoGenerateCourseSyllabusOutput = z.infer<typeof AutoGenerateCourseSyllabusOutputSchema>;

export async function autoGenerateCourseSyllabus(input: AutoGenerateCourseSyllabusInput): Promise<AutoGenerateCourseSyllabusOutput> {
  return autoGenerateCourseSyllabusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoGenerateCourseSyllabusPrompt',
  input: {schema: AutoGenerateCourseSyllabusInputSchema},
  output: {schema: AutoGenerateCourseSyllabusOutputSchema},
  prompt: `You are an experienced curriculum designer. Your task is to generate a comprehensive course syllabus based on the provided information.

  Course Topic: {{{courseTopic}}}
  Target Audience: {{{targetAudience}}}
  Learning Objectives: {{{learningObjectives}}}
  Number of Modules: {{{desiredNumberOfModules}}}

  Create a detailed syllabus including module breakdowns, topics to be covered in each module, and suggested learning activities. The syllabus should be well-structured and easy to follow. Ensure that all learning objectives are covered.
  Your response should be well formatted and use markdown to clearly define the module name, followed by topics and learning activities. Each module should be comprehensive and contribute to the overall learning objectives of the course.
  Make sure that the number of modules is equal to the desiredNumberOfModules specified above.
  `,
});

const autoGenerateCourseSyllabusFlow = ai.defineFlow(
  {
    name: 'autoGenerateCourseSyllabusFlow',
    inputSchema: AutoGenerateCourseSyllabusInputSchema,
    outputSchema: AutoGenerateCourseSyllabusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
