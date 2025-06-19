
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
  prompt: `You are an expert educational content curator. Your task is to suggest YouTube videos for a given topic.
Find {{{numberOfSuggestions}}} EMBEDDABLE and HIGH-QUALITY YouTube videos for: "{{{searchQuery}}}".

CRITICAL EMBEDDING REQUIREMENTS:
- ONLY suggest videos from channels that ALLOW EMBEDDING
- Prioritize established educational channels with proven embeddable content
- AVOID music videos, entertainment content, or channels that typically disable embedding
- Focus on educational institutions, tutorial channels, and programming/tech channels

TRUSTED EMBEDDABLE CHANNELS (prioritize these):
- Khan Academy, freeCodeCamp, MIT OpenCourseWare
- Crash Course, 3Blue1Brown, Coursera, edX
- Programming with Mosh, Traversy Media, The Net Ninja
- Google Developers, Microsoft Developer, AWS Training
- Harvard Extension School, Stanford Online
- Academind, Derek Banas, Coding Tech

When suggesting videos, prioritize:
1. **Embedding Compatibility**: Only channels known to allow embedding
2. **Educational Quality**: Structured, clear teaching content
3. **Relevance**: Directly matches the search topic
4. **Channel Reputation**: 50K+ subscribers for tutorial channels, any size for official institutions
5. **Recency**: Prefer content from last 2-3 years unless topic is timeless
6. **Language**: {{#if preferredLanguage}}Prioritize {{{preferredLanguage}}}, then English{{else}}Focus on English, include Hindi/Hinglish if relevant{{/if}}

AVOID THESE TYPES:
- Music channels or entertainment content
- Channels with frequent copyright issues
- Private coaching or premium content channels
- Channels that monetize through external platforms only
- Gaming, lifestyle, or off-topic content

For each video or playlist, provide:
- langCode: Language code ('en', 'hi', etc.)
- langName: Full language name ('English', 'Hindi', 'Hinglish')
- youtubeEmbedUrl: PROPER embed URL format:
  * Single videos: https://www.youtube.com/embed/dQw4w9WgXcQ
  * Playlists: https://www.youtube.com/embed/videoseries?list=PLrAXtmRdnEQy4wHYaDv9JqTy4gn7w8-TL
- title: Actual video/playlist title from the channel
- creator: Channel name (e.g., "Khan Academy", "freeCodeCamp")
- isPlaylist: true for playlists/series, false for single videos

EMBEDDING VERIFICATION:
- Only suggest content you're confident allows embedding
- Prefer channels that consistently have embeddable content
- If unsure about a channel's embedding policy, choose a more established alternative

EXAMPLES OF GOOD SUGGESTIONS:
- For "JavaScript basics": freeCodeCamp's JavaScript course
- For "Linear Algebra": 3Blue1Brown's Essence of Linear Algebra series
- For "Python programming": Programming with Mosh Python tutorial
- For "Computer Science": MIT 6.001 Introduction to Computer Science

Return fewer results if you can't find enough suitable embeddable content.
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
