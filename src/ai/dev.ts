import { config } from 'dotenv';
config();

import '@/ai/flows/ai-quiz-generator.ts';
import '@/ai/flows/auto-generate-quiz-mock-tests.ts';
import '@/ai/flows/auto-generate-course-syllabus.ts';
import '@/ai/flows/find-youtube-videos-flow.ts';
import '@/ai/flows/suggest-youtube-videos-for-topic-flow.ts';
import '@/ai/flows/fetch-youtube-playlist-items-flow.ts';
import '@/ai/flows/doubt-solver-flow.ts';
import '@/ai/flows/suggest-module-subtopics-flow.ts';
import '@/ai/flows/suggest-module-practice-task-flow.ts';
import '@/ai/flows/generate-course-schedule-flow.ts';
import '@/ai/flows/extract-and-analyze-content-flow.ts';
import '@/ai/flows/generate-course-structure-flow.ts';
import '@/ai/flows/generate-quiz-flow.ts';
// Ensure all flows are imported if they are to be discoverable by Genkit dev UI or tools

