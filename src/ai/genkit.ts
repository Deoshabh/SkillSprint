import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if we're in build mode
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.RUNTIME;

// Get API key from environment with fallback error message
const getGeminiApiKey = () => {
  // During build time, return a dummy key to avoid errors
  if (isBuildTime) {
    return 'build-time-placeholder';
  }
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not set! Please:\n' +
      '1. Get your API key from https://aistudio.google.com/app/apikey\n' +
      '2. Add it to your .env.local file: GEMINI_API_KEY=your_actual_key\n' +
      '3. Restart your development server'
    );
  }
  
  return apiKey;
};

// Create a mock AI instance for build time
const createMockAI = () => ({
  definePrompt: () => () => Promise.resolve({ output: { quizQuestions: [] } }),
  defineFlow: () => () => Promise.resolve({ quizQuestions: [] }),
});

// Use real AI in runtime, mock AI during build
export const ai = isBuildTime 
  ? createMockAI()
  : genkit({
      plugins: [googleAI({apiKey: getGeminiApiKey()})],
      model: 'googleai/gemini-2.0-flash',
    });
