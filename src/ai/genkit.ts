import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if we're in build mode - improved detection
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.NODE_ENV === 'production' && !process.env.RUNTIME ||
                   process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL ||
                   process.argv.includes('build') ||
                   process.env.npm_lifecycle_event === 'build';

// Get API key from environment with fallback error message
const getGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  // During build time or when API key is missing, return a dummy key
  if (isBuildTime || !apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('AI features will be disabled - API key not available during build');
    return 'build-time-placeholder-key-12345';
  }
  
  return apiKey;
};

// Create a mock AI instance for build time or missing API key
const createMockAI = () => ({
  definePrompt: (config: any) => (input: any) => Promise.resolve({ 
    output: { 
      courseSyllabus: 'AI service temporarily unavailable. Please configure GEMINI_API_KEY.',
      quizQuestions: [] 
    } 
  }),
  defineFlow: (config: any, fn: any) => (input: any) => Promise.resolve({ 
    courseSyllabus: 'AI service temporarily unavailable. Please configure GEMINI_API_KEY.',
    quizQuestions: [] 
  }),
});

// Safely initialize AI
let aiInstance;
try {
  const apiKey = getGeminiApiKey();
  
  if (isBuildTime || apiKey === 'build-time-placeholder-key-12345') {
    console.log('Using mock AI for build time or missing API key');
    aiInstance = createMockAI();
  } else {
    aiInstance = genkit({
      plugins: [googleAI({apiKey})],
      model: 'googleai/gemini-2.0-flash',
    });
  }
} catch (error) {
  console.warn('Failed to initialize AI service, using mock:', error);
  aiInstance = createMockAI();
}

export const ai = aiInstance;
