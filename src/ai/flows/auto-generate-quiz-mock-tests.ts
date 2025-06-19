'use server';
/**
 * @fileOverview AI agent for generating quizzes, mock tests, and practice tasks.
 *
 * - autoGenerateAssessments - A function that generates assessments based on course modules.
 * - AutoGenerateAssessmentsInput - The input type for the autoGenerateAssessments function.
 * - AutoGenerateAssessmentsOutput - The return type for the autoGenerateAssessments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoGenerateAssessmentsInputSchema = z.object({
  moduleContent: z
    .string() 
    .describe('The content of the course module, including text, videos, and other resources.'),
  assessmentType: z
    .enum(['quiz', 'mock test', 'practice tasks'])
    .describe('The type of assessment to generate.'),
  numberOfQuestions: z
    .number()
    .int()
    .positive()
    .default(5)
    .describe('The number of questions or tasks to generate.'),
});
export type AutoGenerateAssessmentsInput = z.infer<typeof AutoGenerateAssessmentsInputSchema>;

const AutoGenerateAssessmentsOutputSchema = z.object({
  assessment: z.string().describe('The generated assessment content.'),
});
export type AutoGenerateAssessmentsOutput = z.infer<typeof AutoGenerateAssessmentsOutputSchema>;

export async function autoGenerateAssessments(
  input: AutoGenerateAssessmentsInput
): Promise<AutoGenerateAssessmentsOutput> {
  return autoGenerateAssessmentsFlow(input);
}

const assessmentPrompt = ai.definePrompt({
  name: 'assessmentPrompt',
  input: {schema: AutoGenerateAssessmentsInputSchema},
  output: {schema: AutoGenerateAssessmentsOutputSchema},
  prompt: `You are an expert course content creator, skilled at generating assessments.

  Based on the course module content provided, generate the following assessment:

  Assessment Type: {{{assessmentType}}}
  Number of Questions: {{{numberOfQuestions}}}

  Module Content:
  {{moduleContent}}

  Assessment:
  `, 
});

const autoGenerateAssessmentsFlow = ai.defineFlow(
  {
    name: 'autoGenerateAssessmentsFlow',
    inputSchema: AutoGenerateAssessmentsInputSchema,
    outputSchema: AutoGenerateAssessmentsOutputSchema,
  },
  async input => {
    const {output} = await assessmentPrompt(input);
    return output!;
  }
);
