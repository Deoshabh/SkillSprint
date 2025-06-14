
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
    const messages: ChatMessage[] = [];
    if (chatHistory) {
      messages.push(...chatHistory);
    }
    messages.push({ role: 'user', parts: [{ text: query }] });

    const genResponse = await ai.generate({
      prompt: query, 
      history: messages.slice(0, -1), 
      config: {
        // Optional: Add temperature, topK, topP if needed
        // temperature: 0.7,
        // safetySettings can be added here if issues persist, e.g.:
        // safetySettings: [
        //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        // ],
      },
      system: doubtSolverSystemInstruction,
    });
    
    const aiText = genResponse.text; // Use the .text accessor on GenerateResponseData

    if (!aiText) {
        console.error("AI did not return a usable text response from doubtSolverFlow. genResponse.text was empty.");
        const candidate = genResponse.candidates[0];
        if (candidate) {
          console.error("  Candidate Finish Reason:", candidate.finishReason);
          if (candidate.finishMessage) {
            console.error("  Candidate Finish Message:", candidate.finishMessage);
          }
          if (candidate.message && candidate.message.parts && candidate.message.parts.length > 0) {
            const partSummaries = candidate.message.parts.map(p => {
              if (p.text) return ({ type: 'text', length: p.text.length, startsWith: p.text.substring(0, 50) + (p.text.length > 50 ? '...' : '') });
              if (p.toolRequest) return ({ type: 'toolRequest', name: p.toolRequest.name });
              return ({ type: 'unknownPart' });
            });
            console.error("  Candidate Message Parts structure:", JSON.stringify(partSummaries));
          } else {
            console.error("  Candidate had no message parts or no text content in parts.");
          }
          // Log safety-related information if present in candidate.custom
          if (candidate.custom?.safetyRatings) {
             console.error("  Candidate Safety Ratings:", JSON.stringify(candidate.custom.safetyRatings));
          }
           if (candidate.custom?.blocked !== undefined) { // Check if blocked field exists
             console.error("  Candidate Blocked Status:", candidate.custom.blocked);
          }
        } else {
          console.error("  No candidate found in AI response.");
          // Avoid logging the entire genResponse if it could be huge or sensitive.
          // Log key aspects like number of candidates if that's useful.
          console.error("  Full AI Response Data (candidates count):", genResponse.candidates?.length ?? 0);
        }
        return { response: "I'm sorry, I couldn't generate a response at this moment. Please try again." };
    }

    return { response: aiText };
  }
);
