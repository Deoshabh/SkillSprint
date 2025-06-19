
'use server';
/**
 * @fileOverview AI flow for solving user doubts on the SkillSprint platform.
 *
 * - doubtSolverFlow - A function that responds to user queries.
 * - DoubtSolverInput - The input type for the doubtSolverFlow function.
 * - DoubtSolverOutput - The return type for the doubtSolverFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ChatMessage } from '@/lib/types'; // Using the defined ChatMessage type

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

const DoubtSolverInputSchema = z.object({
  query: z.string().describe('The user\'s current question or doubt.'),
  chatHistory: z.array(ChatMessageSchema).optional().describe('The preceding conversation history.'),
  // You could add courseContext: z.string().optional().describe('The current course/module context if available.')
});
export type DoubtSolverInput = z.infer<typeof DoubtSolverInputSchema>;

const DoubtSolverOutputSchema = z.object({
  response: z.string().describe('The AI\'s answer to the user\'s query.'),
});
export type DoubtSolverOutput = z.infer<typeof DoubtSolverOutputSchema>;

export async function doubtSolver(input: DoubtSolverInput): Promise<DoubtSolverOutput> {
  return doubtSolverFlow(input);
}

const doubtSolverSystemInstruction = `You are SkillSprint AI, a friendly and knowledgeable assistant for the SkillSprint learning platform.
Your primary goal is to help users by answering their questions clearly and concisely.
Focus on topics related to SkillSprint's courses (Full-Stack Development, DSA, DevOps, English Communication, Design, AI Tools, Aptitude), platform features, or general learning concepts relevant to these areas.
If a question is outside these topics, or asks for personal opinions, or is harmful, politely decline to answer or state that it's beyond your current scope as SkillSprint's learning assistant.
Keep your responses helpful, encouraging, and easy to understand.
You do not have access to specific user data or their progress unless explicitly provided in the query history.
If asked about a specific problem from a course, provide conceptual guidance rather than direct answers to assignments.
Example: If a user says "I'm stuck on the flexbox assignment in module 2", you could respond with "Flexbox can be tricky! Remember the main concepts are the container and items. Key properties to look at are 'display: flex' on the container, and then 'flex-direction', 'justify-content', and 'align-items' to position items. What specific part are you finding challenging?".
If a user query is too vague, ask for clarification. Example: User: "Help with JavaScript." AI: "Sure, I can help with JavaScript! What specific topic or problem are you working on?".
`;

const doubtSolverFlow = ai.defineFlow(
  {
    name: 'doubtSolverFlow',
    inputSchema: DoubtSolverInputSchema,
    outputSchema: DoubtSolverOutputSchema,
  },
  async ({ query, chatHistory }) => {
    // Prepare the context from chat history
    let conversationContext = '';
    if (chatHistory && chatHistory.length > 0) {
      conversationContext = chatHistory
        .map(msg => `${msg.role}: ${msg.parts[0]?.text || ''}`)
        .join('\n');
    }

    // Prepare the full prompt with system instruction and context
    const fullPrompt = `${doubtSolverSystemInstruction}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}

User question: ${query}

Please provide a helpful and detailed response:`;

    try {
      const genResponse = await ai.generate(fullPrompt);
      const aiText = genResponse.text;

      if (!aiText) {
        console.error("AI did not return a usable text response from doubtSolverFlow. genResponse.text was empty.");
        console.error("genResponse:", JSON.stringify(genResponse, null, 2));
        return {
          response: "I'm sorry, I wasn't able to generate a helpful response right now. Please try rephrasing your question or ask something else."
        };
      }

      return { response: aiText };
    } catch (error) {
      console.error("Error in doubtSolverFlow:", error);
      return {
        response: "I'm sorry, I encountered an error while processing your question. Please try again."
      };
    }
  }
);
