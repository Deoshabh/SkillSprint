
'use server';
/**
 * @fileOverview AI flow for generating a suggested weekly course schedule.
 *
 * - generateCourseSchedule - A function to generate a weekly schedule.
 * - GenerateCourseScheduleInput - The input type.
 * - GenerateCourseScheduleOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCourseScheduleInputSchema = z.object({
  courseTitle: z.string().describe('The title of the course.'),
  moduleTitles: z.array(z.string()).describe('An array of module titles in the course, in order.'),
  estimatedCourseDurationWeeks: z.number().int().positive().describe('The desired total duration of the course in weeks.'),
  studyHoursPerWeek: z.number().optional().default(10).describe('Estimated study hours per week the student might dedicate.'),
});
export type GenerateCourseScheduleInput = z.infer<typeof GenerateCourseScheduleInputSchema>;

const GenerateCourseScheduleOutputSchema = z.object({
  scheduleText: z.string().describe('A markdown formatted weekly schedule suggesting module focus and activities.'),
});
export type GenerateCourseScheduleOutput = z.infer<typeof GenerateCourseScheduleOutputSchema>;

export async function generateCourseSchedule(input: GenerateCourseScheduleInput): Promise<GenerateCourseScheduleOutput> {
  return generateCourseScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCourseSchedulePrompt',
  input: {schema: GenerateCourseScheduleInputSchema},
  output: {schema: GenerateCourseScheduleOutputSchema},
  prompt: `You are an expert instructional designer tasked with creating a suggested weekly study schedule for an online course.

Course Title: {{{courseTitle}}}
Number of Modules: {{{moduleTitles.length}}}
Modules (in order):
{{#each moduleTitles}}
- {{{this}}}
{{/each}}
Desired Course Duration: {{{estimatedCourseDurationWeeks}}} weeks
Target Study Time: Approximately {{{studyHoursPerWeek}}} hours per week.

Based on this information, create a realistic and balanced weekly schedule.
- Distribute the modules across the {{{estimatedCourseDurationWeeks}}} weeks. Some weeks might cover more than one module if they are short, or a single module might span multiple weeks if it's substantial.
- For each week, list which module(s) should be the focus.
- Suggest key learning activities for each week (e.g., "Watch video lectures for Module X", "Complete practice exercises for Module Y", "Work on mini-project for Module Z", "Review concepts from previous weeks").
- Ensure the workload seems reasonable for the target study time.
- The output should be a single string formatted in Markdown. Use headings for each week (e.g., "## Week 1").

Example Output Format:

## Week 1: Introduction to Topic & Module 1
- Focus: {{{moduleTitles.[0]}}}
- Activities:
  - Watch introductory videos.
  - Complete readings for Module 1.
  - Attempt initial practice problems.

## Week 2: Deep Dive into Module 2
- Focus: {{{moduleTitles.[1]}}}
- Activities:
  - Go through video lectures for Module 2.
  - Participate in discussion forums.
  - Start working on the first assignment.
...and so on for all {{{estimatedCourseDurationWeeks}}} weeks.

Make sure the schedule covers all modules and fits within the {{{estimatedCourseDurationWeeks}}}-week timeframe. If there are more modules than weeks, combine logically related modules into single weeks or suggest a faster pace. If there are fewer modules than weeks, spread them out or suggest more in-depth review/project time.
`,
});

const generateCourseScheduleFlow = ai.defineFlow(
  {
    name: 'generateCourseScheduleFlow',
    inputSchema: GenerateCourseScheduleInputSchema,
    outputSchema: GenerateCourseScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
