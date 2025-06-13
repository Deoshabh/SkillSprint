
'use server';
/**
 * @fileOverview AI flow for suggesting YouTube videos based on a topic.
 *
 * - suggestYoutubeVideosForTopic - A function to suggest YouTube videos.
 * - SuggestYoutubeVideosForTopicInput - The input type for the function.
 * - SuggestYoutubeVideosForTopicOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

// Define VideoLinkSchema directly in this file for output, without .url() for youtubeEmbedUrl
const VideoLinkSchemaForOutput = z.object({
  langCode: z.string().describe("Language code for the video (e.g., 'en', 'hi', 'hinglish')."),
  langName: z.string().describe("Full language name (e.g., 'English', 'Hindi', 'Hinglish')."),
  youtubeEmbedUrl: z.string().describe("The full YouTube embed URL (e.g., 'https://www.youtube.com/embed/VIDEO_ID')."),
  title: z.string().describe("The title of the YouTube video."),
  creator: z.string().optional().describe('The creator or channel name of the YouTube video.'),
  isPlaylist: z.boolean().optional().describe('Set to true if this YouTube URL is a playlist or video series.'),
});


const SuggestYoutubeVideosForTopicInputSchema = z.object({
  searchQuery: z.string().describe('The topic or query to search videos for.'),
  numberOfSuggestions: z.number().int().positive().default(3).describe('The desired number of video suggestions (e.g., 3-5).'),
  preferredLanguage: z.string().optional().describe('User preferred language (e.g., "English", "Hindi") to prioritize results.'),
  knownCreator: z.string().optional().describe('If a specific creator is preferred for this topic, mention their channel name.'),
});
export type SuggestYoutubeVideosForTopicInput = z.infer<typeof SuggestYoutubeVideosForTopicInputSchema>;

const SuggestYoutubeVideosForTopicOutputSchema = z.object({
  suggestedVideos: z.array(VideoLinkSchemaForOutput).describe("An array of suggested YouTube video links, each with language information, embed URL, title, optional creator, and playlist indicator."),
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
2.  **Playlists**: If good quality, comprehensive playlists exist for the topic, prefer them.
3.  **Creator**: {{#if knownCreator}}If possible, find content from the creator: {{{knownCreator}}}.{{else}}Consider videos from reputable or popular creators.{{/if}}
4.  **Recency**: Prefer recent or popular, up-to-date videos if the topic is time-sensitive, otherwise a mix is fine.
5.  **Language**: {{#if preferredLanguage}}Prioritize videos in the user's preferred language: {{{preferredLanguage}}}. Then, provide options in English, and if relevant, Hindi and Hinglish.{{else}}Focus on providing English videos first. If possible and relevant, include one Hindi and one Hinglish video.{{/if}}

For each video or playlist, provide:
- langCode: Language code (e.g., 'en' for English, 'hi' for Hinglish).
- langName: Full language name (e.g., 'English', 'Hindi', 'Hinglish').
- youtubeEmbedUrl: The full YouTube embed URL (format: 'https://www.youtube.com/embed/VIDEO_ID' for single videos, or 'https://www.youtube.com/embed/videoseries?list=PLAYLIST_ID' for playlists). Ensure this is an EMBED URL.
- title: The actual title of the YouTube video or playlist.
- creator: (Optional) The creator or channel name of the video/playlist.
- isPlaylist: (Optional) Set to true if the URL represents a YouTube playlist or video series, false or omit otherwise.

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
    // Ensure URLs are actual embed URLs and infer isPlaylist if not set
    const validatedVideos = output.suggestedVideos.map(video => {
      let url = video.youtubeEmbedUrl;
      let isPlaylist = video.isPlaylist;

      if (url.includes("watch?v=")) {
        const videoId = url.split("watch?v=")[1]?.split("&")[0];
        if (videoId) {
          url = `https://www.youtube.com/embed/${videoId}`;
           if (isPlaylist === undefined) isPlaylist = false;
        }
      } else if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1]?.split("?")[0];
        if (videoId) {
          url = `https://www.youtube.com/embed/${videoId}`;
           if (isPlaylist === undefined) isPlaylist = false;
        }
      } else if (url.includes("playlist?list=")) {
        const listId = url.split("playlist?list=")[1]?.split("&")[0];
        if (listId) {
          url = `https://www.youtube.com/embed/videoseries?list=${listId}`;
          if (isPlaylist === undefined) isPlaylist = true;
        }
      } else if (url.includes("/embed/") && url.includes("list=")) { // More robust check for embed playlists
          if (isPlaylist === undefined) isPlaylist = true;
      } else if (!url.includes("/embed/")) {
         const videoId = url.split("/").pop()?.split("?")[0];
         if (videoId && !url.includes("videoseries")) {
            url = `https://www.youtube.com/embed/${videoId}`;
            if (isPlaylist === undefined) isPlaylist = false;
         }
      }
      // Final check for embed playlist pattern
      if (url.includes("/embed/videoseries?list=") && isPlaylist === undefined) {
        isPlaylist = true;
      } else if (isPlaylist === undefined) {
        isPlaylist = false;
      }
      return { ...video, youtubeEmbedUrl: url, isPlaylist };
    });
    return { suggestedVideos: validatedVideos };
  }
);
