
'use server';
/**
 * @fileOverview AI flow for suggesting YouTube videos based on a topic.
 *
 * - suggestYoutubeVideosForTopic - A function to suggest YouTube videos.
 * - SuggestYoutubeVideosForTopicInput - The input type for the function.
 * - SuggestYoutubeVideosForTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define VideoLinkSchema directly in this file
const VideoLinkSchema = z.object({
  langCode: z.string().describe("Language code for the video (e.g., 'en', 'hi', 'hinglish')."),
  langName: z.string().describe("Full language name (e.g., 'English', 'Hindi', 'Hinglish')."),
  youtubeEmbedUrl: z.string().url().describe("The full YouTube embed URL (e.g., 'https://www.youtube.com/embed/VIDEO_ID')."),
  title: z.string().describe("The title of the YouTube video."),
  creator: z.string().optional().describe('The creator or channel name of the YouTube video.'),
});


const SuggestYoutubeVideosForTopicInputSchema = z.object({
  searchQuery: z.string().describe('The topic or query to search videos for.'),
  numberOfSuggestions: z.number().int().positive().default(3).describe('The desired number of video suggestions (e.g., 3-5).'),
});
export type SuggestYoutubeVideosForTopicInput = z.infer<typeof SuggestYoutubeVideosForTopicInputSchema>;

// Output schema will use the same VideoLinkSchema from the other flow
const SuggestYoutubeVideosForTopicOutputSchema = z.object({
  suggestedVideos: z.array(VideoLinkSchema).describe("An array of suggested YouTube video links, each with language information, embed URL, title, and optional creator."),
});
export type SuggestYoutubeVideosForTopicOutput = z.infer<typeof SuggestYoutubeVideosForTopicOutputSchema>;


export async function suggestYoutubeVideosForTopic(input: SuggestYoutubeVideosForTopicInput): Promise<SuggestYoutubeVideosForTopicOutput> {
  return suggestYoutubeVideosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestYoutubeVideosForTopicPrompt',
  input: {schema: SuggestYoutubeVideosForTopicInputSchema},
  output: {schema: SuggestYoutubeVideosForTopicOutputSchema},
  prompt: `You are an expert content curator. Your task is to suggest YouTube videos for a given topic.
Please find {{{numberOfSuggestions}}} relevant YouTube videos for the following topic: "{{{searchQuery}}}".

When suggesting videos, try to prioritize:
1.  **Relevance**: How closely the video matches the topic.
2.  **Popularity**: (Simulated) Videos that are generally well-regarded or have high view counts if known.
3.  **Recency**: (Simulated) Prefer more up-to-date videos if the topic is time-sensitive, otherwise a mix is fine.

For each video, provide:
- langCode: Language code (e.g., 'en' for English, 'hi' for Hindi, 'hinglish' for Hinglish).
- langName: Full language name (e.g., 'English', 'Hindi', 'Hinglish').
- youtubeEmbedUrl: The full YouTube embed URL (format: 'https://www.youtube.com/embed/VIDEO_ID'). Ensure this is an EMBED URL.
- title: The actual title of the YouTube video.
- creator: (Optional) The creator or channel name of the video.

Focus on providing English videos first. If possible and relevant, include one Hindi and one Hinglish video.
If you cannot find enough suitable videos, return as many as you can find.
Return the results as an array named 'suggestedVideos'.
`,
});

const suggestYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'suggestYoutubeVideosForTopicFlow',
    inputSchema: SuggestYoutubeVideosForTopicInputSchema,
    outputSchema: SuggestYoutubeVideosForTopicOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
     if (!output?.suggestedVideos) {
      return { suggestedVideos: [] };
    }
    // Ensure URLs are actual embed URLs
    const validatedVideos = output.suggestedVideos.map(video => {
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
    return { suggestedVideos: validatedVideos };
  }
);

