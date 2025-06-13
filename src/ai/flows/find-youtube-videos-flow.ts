
'use server';
/**
 * @fileOverview AI flow for finding relevant YouTube videos for a course module.
 *
 * - findYoutubeVideosForModule - A function to find YouTube videos.
 * - FindYoutubeVideosInput - The input type for the findYoutubeVideosForModule function.
 * - FindYoutubeVideosOutput - The return type for the findYoutubeVideosForModule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VideoLinkSchemaForOutput = z.object({
  langCode: z.string().describe("Language code for the video (e.g., 'en', 'hi', 'hinglish')."),
  langName: z.string().describe("Full language name (e.g., 'English', 'Hindi', 'Hinglish')."),
  youtubeEmbedUrl: z.string().describe("The full YouTube embed URL (e.g., 'https://www.youtube.com/embed/VIDEO_ID')."), // Removed .url() for output schema
  title: z.string().describe("The title of the YouTube video."),
  creator: z.string().optional().describe('The creator or channel name of the YouTube video.'),
});

const FindYoutubeVideosInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the course module.'),
  moduleDescription: z.string().optional().describe('A brief description of the course module content.'),
});
export type FindYoutubeVideosInput = z.infer<typeof FindYoutubeVideosInputSchema>;

const FindYoutubeVideosOutputSchema = z.object({
  videos: z.array(VideoLinkSchemaForOutput).describe("An array of found YouTube video links, each with language information, embed URL, title, and optional creator."),
});
export type FindYoutubeVideosOutput = z.infer<typeof FindYoutubeVideosOutputSchema>;


export async function findYoutubeVideosForModule(input: FindYoutubeVideosInput): Promise<FindYoutubeVideosOutput> {
  return findYoutubeVideosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findYoutubeVideosPrompt',
  input: { schema: FindYoutubeVideosInputSchema },
  output: { schema: FindYoutubeVideosOutputSchema }, // Uses VideoLinkSchemaForOutput
  prompt: `You are a helpful assistant that finds relevant YouTube videos for educational module content.
Given the module title and optional description, find 2-3 YouTube videos that would be suitable.

Module Title: {{{moduleTitle}}}
{{#if moduleDescription}}
Module Description: {{{moduleDescription}}}
{{/if}}

For each video, provide:
- langCode: Language code (e.g., 'en' for English, 'hi' for Hindi, 'hinglish' for Hinglish).
- langName: Full language name (e.g., 'English', 'Hindi', 'Hinglish').
- youtubeEmbedUrl: The full YouTube embed URL (format: 'https://www.youtube.com/embed/VIDEO_ID'). Ensure this is an EMBED URL.
- title: The actual title of the YouTube video.
- creator: (Optional) The creator or channel name of the video.

Prioritize videos in English. If possible, also provide one video in Hindi and one in Hinglish if relevant and available for the topic.
If you cannot find a suitable video for a particular language or for the topic, you can omit it from the results or return fewer videos.
Return the results as an array of video objects.
`,
});

const findYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'findYoutubeVideosFlow',
    inputSchema: FindYoutubeVideosInputSchema,
    outputSchema: FindYoutubeVideosOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output?.videos) {
      return { videos: [] };
    }
    // Ensure URLs are actual embed URLs, sometimes the model might return watch URLs
    const validatedVideos = output.videos.map(video => {
      let url = video.youtubeEmbedUrl;
      if (url.includes("watch?v=")) {
        const videoId = url.split("watch?v=")[1]?.split("&")[0];
        if (videoId) {
          url = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (!url.includes("/embed/")) {
         const videoId = url.split("/").pop()?.split("?")[0];
         if (videoId) {
            url = `https://www.youtube.com/embed/${videoId}`;
         }
      }
      return { ...video, youtubeEmbedUrl: url };
    });
    return { videos: validatedVideos };
  }
);
