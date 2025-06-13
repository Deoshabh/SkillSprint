'use server';

/**
 * @fileOverview AI quiz generator flow.
 *
 * - generateQuiz - A function that generates a quiz based on course modules.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  courseModuleContent: z
    .string()
    .describe('The content of the course module to generate a quiz for.'),
  numberOfQuestions: z
    .number()
    .default(5)
    .describe('The number of questions to generate for the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  quizQuestions: z
    .array(z.string())
    .describe('An array of quiz questions generated based on the course module content.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an AI quiz generator that generates quizzes based on the content of a course module.

  Course Module Content: {{{courseModuleContent}}}

  Generate {{{numberOfQuestions}}} quiz questions based on the course module content.  The output should be an array of strings.
  Each question should be challenging and relevant to the course module content.
  Ensure that the questions cover a range of topics within the module.
  The quiz should be suitable for assessing the user's understanding of the material.
  `, 
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
