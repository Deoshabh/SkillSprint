'use server';
/**
 * @fileOverview AI flow for extracting and analyzing content from various sources for course creation.
 *
 * - extractAndAnalyzeContent - A function to extract structured information from source content.
 * - ExtractContentInput - The input type.
 * - ExtractContentOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractContentInputSchema = z.object({
  sourceType: z.enum(['youtube_video', 'youtube_playlist', 'document', 'website', 'text_input', 'file'])
    .describe('The type of source content being analyzed.'),
  contentUrl: z.string().optional().describe('The URL of the content source (if applicable).'),
  rawContent: z.string().describe('The raw content text to analyze.'),
  contentTitle: z.string().optional().describe('The title of the content source.'),
  extractionGoals: z.array(z.string()).optional().describe('Specific goals for content extraction (e.g., "learning objectives", "prerequisites", "key topics").')
});

export type ExtractContentInput = z.infer<typeof ExtractContentInputSchema>;

const ExtractContentOutputSchema = z.object({
  structuredContent: z.object({
    mainTopics: z.array(z.string()).describe('Primary topics covered in the content.'),
    subTopics: z.array(z.string()).describe('Subtopics and detailed areas covered.'),
    learningObjectives: z.array(z.string()).describe('Identified learning objectives or outcomes.'),
    prerequisites: z.array(z.string()).describe('Required knowledge or skills before this content.'),
    keyPoints: z.array(z.string()).describe('Important points and takeaways.'),
    practicalElements: z.array(z.string()).describe('Hands-on activities, exercises, or projects mentioned.'),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']).describe('Assessed difficulty level.'),
    estimatedDuration: z.string().describe('Estimated time to complete this content.'),
    contentFormat: z.enum(['theoretical', 'practical', 'mixed', 'project-based']).describe('The format/style of the content.')
  }).describe('Structured analysis of the content.'),
  courseRelevantSections: z.array(z.object({
    title: z.string().describe('Title of the relevant section.'),
    content: z.string().describe('The actual content of this section.'),
    moduleRecommendation: z.string().describe('Suggested module or course section where this content fits best.')
  })).describe('Sections of content that are particularly relevant for course creation.'),
  suggestedModuleStructure: z.array(z.object({
    moduleTitle: z.string().describe('Suggested title for a course module.'),
    moduleDescription: z.string().describe('Description of what this module should cover.'),
    basedOnContent: z.string().describe('Which part of the source content this module is based on.')
  })).describe('Suggested module structure based on the analyzed content.')
});

export type ExtractContentOutput = z.infer<typeof ExtractContentOutputSchema>;

export async function extractAndAnalyzeContent(input: ExtractContentInput): Promise<ExtractContentOutput> {
  return extractContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractContentPrompt',
  input: { schema: ExtractContentInputSchema },
  output: { schema: ExtractContentOutputSchema },
  prompt: `You are an expert content analyst and instructional designer. Analyze the provided content and extract structured information that can be used to create educational course modules.

Source Type: {{{sourceType}}}
{{#if contentTitle}}Content Title: {{{contentTitle}}}{{/if}}
{{#if contentUrl}}Content URL: {{{contentUrl}}}{{/if}}

Content to analyze:
{{{rawContent}}}

{{#if extractionGoals}}
Focus specifically on these extraction goals:
{{#each extractionGoals}}
- {{this}}
{{/each}}
{{/if}}

Please provide a comprehensive analysis including:

1. **Structured Content Analysis:**
   - Identify the main topics and subtopics
   - Extract clear learning objectives
   - Determine prerequisites
   - Highlight key points and takeaways
   - Note any practical elements (exercises, projects, activities)
   - Assess the difficulty level
   - Estimate duration for learning this content
   - Classify the content format

2. **Course-Relevant Sections:**
   - Break down the content into sections that would be useful for course creation
   - For each section, suggest where it would fit best in a course structure

3. **Module Structure Suggestions:**
   - Based on the content, suggest how it could be organized into course modules
   - Provide clear module titles and descriptions
   - Explain how each module relates to the source content

Focus on creating actionable, structured information that can directly inform course design and module creation. Be specific and detailed in your analysis.`,
});

const extractContentFlow = ai.defineFlow(
  {
    name: 'extractContentFlow',
    inputSchema: ExtractContentInputSchema,
    outputSchema: ExtractContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
