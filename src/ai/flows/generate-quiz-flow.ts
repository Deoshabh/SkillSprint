// src/ai/flows/generate-quiz-flow.ts
'use server';
/**
 * @fileOverview AI flow for generating quizzes for course modules with various question types.
 *
 * - generateQuiz - A function to generate quiz questions for a module.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the module for which to generate the quiz.'),
  moduleContent: z.string().describe('The content of the module to base quiz questions on.'),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz questions.'),
  questionCount: z.number().describe('The number of questions to generate for the quiz.'),
  questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'short-answer', 'coding'])).describe('Types of questions to include in the quiz.'),
  passingScore: z.number().describe('The minimum percentage score required to pass the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'coding';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const GenerateQuizOutputSchema = z.object({
  quizTitle: z.string().describe('The title of the generated quiz.'),
  questions: z.array(z.any()).describe('Array of quiz questions with their details.'),
  totalPoints: z.number().describe('Total points possible in the quiz.'),
  passingScore: z.number().describe('Minimum score required to pass.'),
  estimatedTime: z.string().describe('Estimated time to complete the quiz.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert quiz creator. Your task is to generate a comprehensive quiz for the module "{{{moduleTitle}}}" with the following requirements:

MODULE CONTENT:
{{{moduleContent}}}

QUIZ REQUIREMENTS:
- Difficulty Level: {{{difficultyLevel}}}
- Number of Questions: {{{questionCount}}}
- Question Types: {{{questionTypes}}}
- Passing Score: {{{passingScore}}}%

Please generate questions that:
1. Test understanding of key concepts from the module content
2. Are appropriate for {{{difficultyLevel}}} level
3. Include a mix of the requested question types
4. Have clear, unambiguous correct answers
5. Include explanations for correct answers

For each question, provide:
- Question text
- Question type
- For multiple choice: 4 options with one correct answer
- For true/false: the statement and correct answer
- For short answer: the expected answer or key points
- For coding: a coding problem with expected solution approach
- Explanation of the correct answer
- Point value (distribute points evenly across all questions)
- Difficulty level

Format the response as a structured quiz with a title and list of questions.

EXAMPLE FORMAT:
Quiz Title: [Module Title] Assessment

Question 1:
Type: multiple-choice
Question: What is the primary purpose of...?
Options: A) Option 1, B) Option 2, C) Option 3, D) Option 4
Correct Answer: B
Explanation: The correct answer is B because...
Points: 10
Difficulty: {{{difficultyLevel}}}

[Continue for all questions...]`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // For now, return a structured response with fallback questions
    // In a real implementation, you would parse the AI output
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < input.questionCount; i++) {
      questions.push(generateFallbackQuestion(i + 1, input));
    }
    
    return {
      quizTitle: `${input.moduleTitle} Assessment`,
      questions,
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      passingScore: input.passingScore,
      estimatedTime: `${Math.max(5, Math.ceil(questions.length * 2))} minutes`
    };
  }
);

function parseQuizResponse(response: string, input: GenerateQuizInput): GenerateQuizOutput {
  const lines = response.split('\n').filter(line => line.trim());
  
  // Extract quiz title
  let quizTitle = `${input.moduleTitle} Quiz`;
  const titleMatch = response.match(/Quiz Title:\s*(.*)/i);
  if (titleMatch) {
    quizTitle = titleMatch[1].trim();
  }

  // Parse questions
  const questions: QuizQuestion[] = [];
  let currentQuestion: Partial<QuizQuestion> = {};
  let questionCounter = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^Question \d+:/i)) {
      // Save previous question if exists
      if (currentQuestion.question) {
        questions.push(completeQuestion(currentQuestion, questionCounter - 1, input));
      }
      
      // Start new question
      currentQuestion = {
        id: `q${questionCounter}`,
        difficulty: input.difficultyLevel
      };
      questionCounter++;
    } else if (trimmedLine.match(/^Type:\s*/i)) {
      const type = trimmedLine.replace(/^Type:\s*/i, '').trim() as QuizQuestion['type'];
      if (['multiple-choice', 'true-false', 'short-answer', 'coding'].includes(type)) {
        currentQuestion.type = type;
      }
    } else if (trimmedLine.match(/^Question:\s*/i)) {
      currentQuestion.question = trimmedLine.replace(/^Question:\s*/i, '').trim();
    } else if (trimmedLine.match(/^Options:\s*/i)) {
      const optionsText = trimmedLine.replace(/^Options:\s*/i, '').trim();
      currentQuestion.options = optionsText.split(',').map(opt => 
        opt.trim().replace(/^[A-D]\)\s*/, '')
      );
    } else if (trimmedLine.match(/^Correct Answer:\s*/i)) {
      currentQuestion.correctAnswer = trimmedLine.replace(/^Correct Answer:\s*/i, '').trim();
    } else if (trimmedLine.match(/^Explanation:\s*/i)) {
      currentQuestion.explanation = trimmedLine.replace(/^Explanation:\s*/i, '').trim();
    } else if (trimmedLine.match(/^Points:\s*/i)) {
      const points = parseInt(trimmedLine.replace(/^Points:\s*/i, '').trim());
      currentQuestion.points = isNaN(points) ? 10 : points;
    }
  }

  // Save last question
  if (currentQuestion.question) {
    questions.push(completeQuestion(currentQuestion, questionCounter - 1, input));
  }

  // Generate fallback questions if parsing failed
  if (questions.length === 0) {
    for (let i = 0; i < input.questionCount; i++) {
      questions.push(generateFallbackQuestion(i + 1, input));
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const estimatedTime = `${Math.max(5, Math.ceil(questions.length * 2))} minutes`;

  return {
    quizTitle,
    questions: questions.slice(0, input.questionCount),
    totalPoints,
    passingScore: input.passingScore,
    estimatedTime
  };
}

function completeQuestion(partial: Partial<QuizQuestion>, index: number, input: GenerateQuizInput): QuizQuestion {
  return {
    id: partial.id || `q${index}`,
    type: partial.type || 'multiple-choice',
    question: partial.question || `Question ${index} about ${input.moduleTitle}`,
    options: partial.options || (partial.type === 'multiple-choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined),
    correctAnswer: partial.correctAnswer || 'A',
    explanation: partial.explanation || 'This is the correct answer based on the module content.',
    points: partial.points || 10,
    difficulty: partial.difficulty || input.difficultyLevel
  };
}

function generateFallbackQuestion(index: number, input: GenerateQuizInput): QuizQuestion {
  const questionType = input.questionTypes[0] || 'multiple-choice';
  
  return {
    id: `q${index}`,
    type: questionType,
    question: `What is a key concept from ${input.moduleTitle}?`,
    options: questionType === 'multiple-choice' ? [
      'Concept A',
      'Concept B', 
      'Concept C',
      'Concept D'
    ] : undefined,
    correctAnswer: questionType === 'multiple-choice' ? 'A' : 'True',
    explanation: 'This question tests understanding of key concepts from the module.',
    points: 10,
    difficulty: input.difficultyLevel
  };
}
