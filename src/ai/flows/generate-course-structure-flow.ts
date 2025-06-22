'use server';
/**
 * @fileOverview AI flow for generating comprehensive course structures from multiple content sources.
 *
 * - generateCourseStructure - A function to create a complete course structure.
 * - GenerateCourseStructureInput - The input type.
 * - GenerateCourseStructureOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SourceContentSchema = z.object({
  title: z.string().describe('Title of the source content.'),
  type: z.enum(['youtube_video', 'youtube_playlist', 'document', 'website', 'text_input', 'file']).describe('Type of source.'),
  extractedTopics: z.array(z.string()).describe('Main topics extracted from this source.'),
  learningObjectives: z.array(z.string()).describe('Learning objectives from this source.'),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']).describe('Difficulty level of this source.'),
  estimatedDuration: z.string().describe('Estimated duration for this content.'),
  practicalElements: z.array(z.string()).describe('Practical elements mentioned in this source.')
});

const GenerateCourseStructureInputSchema = z.object({
  courseTitle: z.string().describe('The title of the course to be created.'),
  courseDescription: z.string().optional().describe('Optional description of the course.'),
  learningObjectives: z.string().optional().describe('Overall learning objectives for the course.'),
  targetAudience: z.enum(['beginners', 'intermediate', 'advanced', 'mixed']).describe('Target audience for the course.'),
  courseDuration: z.string().describe('Desired duration of the course (e.g., "4 weeks", "8 weeks").'),
  moduleCount: z.number().int().positive().describe('Desired number of modules.'),
  learningStyle: z.enum(['video-focused', 'text-focused', 'mixed', 'interactive', 'project-based']).describe('Preferred learning style.'),
  includeAssessments: z.boolean().describe('Whether to include assessments and quizzes.'),
  includePracticalProjects: z.boolean().describe('Whether to include practical projects.'),
  sourceContents: z.array(SourceContentSchema).describe('Array of analyzed source content.')
});

export type GenerateCourseStructureInput = z.infer<typeof GenerateCourseStructureInputSchema>;

const ModuleSchema = z.object({
  moduleNumber: z.number().int().positive().describe('Sequential number of the module.'),
  title: z.string().describe('Title of the module.'),
  description: z.string().describe('Detailed description of what this module covers.'),
  learningObjectives: z.array(z.string()).describe('Specific learning objectives for this module.'),
  topics: z.array(z.string()).describe('Main topics covered in this module.'),
  subtopics: z.array(z.string()).describe('Detailed subtopics and concepts.'),
  practiceActivities: z.array(z.string()).describe('Suggested practice activities or exercises.'),
  assessmentSuggestions: z.array(z.string()).describe('Suggested assessment methods for this module.'),
  estimatedDuration: z.string().describe('Estimated time to complete this module.'),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level of this module.'),
  prerequisiteModules: z.array(z.number()).describe('Module numbers that should be completed before this one.'),
  sourceReferences: z.array(z.string()).describe('Which source materials this module is based on.'),
  contentFormat: z.enum(['video', 'text', 'mixed', 'interactive']).describe('Recommended content format for this module.')
});

const GenerateCourseStructureOutputSchema = z.object({
  courseOverview: z.object({
    title: z.string().describe('Finalized course title.'),
    description: z.string().describe('Comprehensive course description.'),
    overallLearningObjectives: z.array(z.string()).describe('Overall learning objectives for the entire course.'),
    targetAudience: z.string().describe('Description of the target audience.'),
    totalDuration: z.string().describe('Total estimated duration for the course.'),
    difficultyProgression: z.string().describe('How difficulty progresses through the course.'),
    courseFormat: z.string().describe('Overall format and structure of the course.')
  }).describe('Overview of the generated course.'),
  modules: z.array(ModuleSchema).describe('Detailed module structure for the course.'),
  learningPath: z.array(z.object({
    week: z.number().int().positive().describe('Week number in the course.'),
    modulesThisWeek: z.array(z.number()).describe('Module numbers to be covered this week.'),
    weeklyObjectives: z.array(z.string()).describe('Learning objectives for this week.'),
    weeklyActivities: z.array(z.string()).describe('Activities and tasks for this week.'),
    assessments: z.array(z.string()).describe('Assessments or evaluations for this week.')
  })).describe('Week-by-week learning path through the course.'),
  projectSuggestions: z.array(z.object({
    title: z.string().describe('Title of the project.'),
    description: z.string().describe('Description of the project.'),
    applicableModules: z.array(z.number()).describe('Which modules this project applies to.'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Project difficulty level.'),
    estimatedDuration: z.string().describe('Estimated time to complete the project.')
  })).describe('Suggested projects that apply multiple modules.'),
  assessmentStrategy: z.object({
    formativeAssessments: z.array(z.string()).describe('Ongoing assessment methods throughout the course.'),
    summativeAssessments: z.array(z.string()).describe('Major assessments at the end of modules or course.'),
    practicalEvaluations: z.array(z.string()).describe('Hands-on evaluation methods.'),
    certificateRequirements: z.array(z.string()).describe('Requirements for course completion/certification.')
  }).describe('Comprehensive assessment strategy for the course.')
});

export type GenerateCourseStructureOutput = z.infer<typeof GenerateCourseStructureOutputSchema>;

export async function generateCourseStructure(input: GenerateCourseStructureInput): Promise<GenerateCourseStructureOutput> {
  return generateCourseStructureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCourseStructurePrompt',
  input: { schema: GenerateCourseStructureInputSchema },
  output: { schema: GenerateCourseStructureOutputSchema },
  prompt: `You are an expert instructional designer and curriculum developer. Create a comprehensive, well-structured course based on the provided parameters and source materials.

Course Requirements:
- Title: {{{courseTitle}}}
{{#if courseDescription}}- Description: {{{courseDescription}}}{{/if}}
{{#if learningObjectives}}- Learning Objectives: {{{learningObjectives}}}{{/if}}
- Target Audience: {{{targetAudience}}}
- Duration: {{{courseDuration}}}
- Number of Modules: {{{moduleCount}}}
- Learning Style: {{{learningStyle}}}
- Include Assessments: {{{includeAssessments}}}
- Include Practical Projects: {{{includePracticalProjects}}}

Available Source Materials:
{{#each sourceContents}}
**Source {{@index}}: {{this.title}}** ({{this.type}})
- Topics: {{#each this.extractedTopics}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Learning Objectives: {{#each this.learningObjectives}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Difficulty: {{this.difficultyLevel}}
- Duration: {{this.estimatedDuration}}
- Practical Elements: {{#each this.practicalElements}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

{{/each}}

Please create a comprehensive course structure that:

1. **Integrates all source materials** effectively into a cohesive learning experience
2. **Follows sound instructional design principles** with proper sequencing and scaffolding
3. **Matches the specified learning style** and target audience
4. **Provides clear learning progression** from basic to advanced concepts
5. **Includes practical application** opportunities throughout
6. **Incorporates assessment strategies** that align with learning objectives

Design Guidelines:
- Ensure logical progression between modules
- Balance theoretical knowledge with practical application
- Create engaging and interactive learning experiences
- Provide multiple ways for learners to demonstrate understanding
- Include prerequisite mapping to ensure proper learning sequence
- Design assessments that are meaningful and aligned with objectives
- Consider different learning preferences and accessibility needs

The course should be professional, engaging, and provide clear value to learners. Make sure each module builds upon previous knowledge while introducing new concepts at an appropriate pace.`,
});

const generateCourseStructureFlow = ai.defineFlow(
  {
    name: 'generateCourseStructureFlow',
    inputSchema: GenerateCourseStructureInputSchema,
    outputSchema: GenerateCourseStructureOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
