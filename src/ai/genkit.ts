import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Get API key from environment with fallback error message
const getGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not set! Please:\n' +
      '1. Get your API key from https://aistudio.google.com/app/apikey\n' +
      '2. Add it to your .env.local file: GEMINI_API_KEY=your_actual_key\n' +
      '3. Restart your development server'
    );
  }
  
  return apiKey;
};

export const ai = genkit({
  plugins: [googleAI({apiKey: getGeminiApiKey()})],
  model: 'googleai/gemini-2.0-flash',
});
