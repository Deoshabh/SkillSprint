
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-quiz-generator.ts';
import '@/ai/flows/auto-generate-quiz-mock-tests.ts';
import '@/ai/flows/auto-generate-course-syllabus.ts';
import '@/ai/flows/find-youtube-videos-flow.ts';
import '@/ai/flows/suggest-youtube-videos-for-topic-flow.ts';
import '@/ai/flows/fetch-youtube-playlist-items-flow.ts';
import '@/ai/flows/doubt-solver-flow.ts'; // Added new doubt solver flow
// Ensure all flows are imported if they are to be discoverable by Genkit dev UI or tools
