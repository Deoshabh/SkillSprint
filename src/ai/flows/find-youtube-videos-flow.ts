

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
  youtubeEmbedUrl: z.string().describe("The full YouTube embed URL (e.g., 'https://www.youtube.com/embed/VIDEO_ID')."),
  title: z.string().describe("The title of the YouTube video."),
  creator: z.string().optional().describe('The creator or channel name of the YouTube video.'),
  isPlaylist: z.boolean().optional().describe('Set to true if this YouTube URL is a playlist or video series.'),
});

const FindYoutubeVideosInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the course module.'),
  moduleDescription: z.string().optional().describe('A brief description of the course module content.'),
  existingVideos: z.array(z.object({ // Pass existing videos to potentially find more from same creators
    creator: z.string().optional(),
    topic: z.string().optional(), // Could be module title or specific sub-topic
  })).optional().describe('List of existing videos in the module to help find related content or more from same creators.'),
  preferredLanguage: z.string().optional().describe('User preferred language (e.g., "English", "Hindi") to prioritize results.')
});
export type FindYoutubeVideosInput = z.infer<typeof FindYoutubeVideosInputSchema>;

const FindYoutubeVideosOutputSchema = z.object({
  videos: z.array(VideoLinkSchemaForOutput).describe("An array of found YouTube video links, each with language information, embed URL, title, optional creator, and playlist indicator."),
});
export type FindYoutubeVideosOutput = z.infer<typeof FindYoutubeVideosOutputSchema>;


export async function findYoutubeVideosForModule(input: FindYoutubeVideosInput): Promise<FindYoutubeVideosOutput> {
  return findYoutubeVideosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findYoutubeVideosPrompt',
  input: { schema: FindYoutubeVideosInputSchema },
  output: { schema: FindYoutubeVideosOutputSchema },
  prompt: `You are a helpful assistant that finds relevant, high-quality YouTube videos and playlists for educational content.

CRITICAL REQUIREMENTS - Only return videos that are:
1. PUBLICLY AVAILABLE and EMBEDDABLE (NOT age-restricted, private, or region-blocked)
2. From VERIFIED educational channels (channels with substantial subscriber base and educational focus)
3. Educational tutorials, courses, or explanations (NO music videos, vlogs, or entertainment)
4. From well-established channels like: Khan Academy, freeCodeCamp, MIT OpenCourseWare, Crash Course, 3Blue1Brown, Coursera, edX, or similar reputable educational sources
5. Have clear educational titles and descriptions
6. Are confirmed to exist and be accessible for embedding

STRICTLY AVOID:
- Age-restricted or mature content
- Private, unlisted, or member-only videos
- Region-blocked or geo-restricted content
- Videos from channels with less than 10K subscribers (unless exceptionally high quality)
- Music videos, entertainment, gaming, or off-topic content
- Videos with vague titles or clickbait
- Content from suspended, terminated, or inactive channels
- Videos that typically have embedding disabled (music, movies, copyrighted content)

PRIORITIZE THESE TYPES OF CHANNELS:
- Official educational institutions (universities, schools)
- Established online learning platforms
- Professional programming/tech channels with 100K+ subscribers
- Tutorial channels with proven track record
- Official documentation or company channels

Module Title: {{{moduleTitle}}}
{{#if moduleDescription}}
Module Description: {{{moduleDescription}}}
{{/if}}

{{#if preferredLanguage}}
Prioritize videos in: {{{preferredLanguage}}}
Also provide alternatives in English if available.
{{else}}
Prioritize videos in English.
If the topic is relevant to Indian audience, you may also include Hindi or Hinglish content.
{{/if}}

{{#if existingVideos.length}}
Consider existing videos from these creators for additional quality content:
{{#each existingVideos}}
- Creator: {{this.creator}} (Topic: {{this.topic}})
{{/each}}
{{/if}}

SEARCH STRATEGY:
1. Focus on comprehensive tutorial videos or complete educational series/playlists
2. ONLY suggest content from channels you're confident allow embedding:
   - Khan Academy (always embeddable)
   - freeCodeCamp (always embeddable)
   - MIT OpenCourseWare (usually embeddable)
   - Crash Course (always embeddable)
   - Programming with Mosh, Traversy Media (usually embeddable)
   - Official tech company channels (Google, Microsoft, etc.)
3. Prefer recent, well-maintained content (within last 3 years)
4. Include both beginner-friendly and comprehensive content
5. Verify the channel is active and has consistent educational content
6. For programming topics, prioritize channels known for coding tutorials
7. Double-check that suggested content is typically embeddable

EMBED URL REQUIREMENTS:
- For single videos: https://www.youtube.com/embed/VIDEO_ID
- For playlists: https://www.youtube.com/embed/videoseries?list=PLAYLIST_ID
- VIDEO_ID must be exactly 11 characters (letters, numbers, hyphens, underscores)
- PLAYLIST_ID format: PL followed by 32 characters OR other valid playlist formats

QUALITY CHECKS BEFORE SUGGESTING:
- Channel has substantial subscriber base (10K+ preferred)
- Video has good view count relative to channel size
- Educational focus in channel description
- Recent activity on the channel
- No copyright strikes or content warnings

For each video/playlist found, provide:
- langCode: Two-letter language code (en, hi, etc.)
- langName: Full language name (English, Hindi, Hinglish)
- youtubeEmbedUrl: MUST be proper embed format:
  * For videos: https://www.youtube.com/embed/VIDEO_ID
  * For playlists: https://www.youtube.com/embed/videoseries?list=PLAYLIST_ID
- title: The actual video/playlist title from YouTube
- creator: Channel name or creator
- isPlaylist: true for playlists, false for single videos

FINAL QUALITY CHECK:
Return ONLY 1-2 results of the HIGHEST quality and most likely to be embeddable.
It's better to return fewer, guaranteed embeddable videos than many that might fail.
If you're not confident about embedding compatibility, don't include it.
Focus on channels like Khan Academy, freeCodeCamp, MIT, Crash Course - these are known to work.

FALLBACK STRATEGY:
If the specific topic is hard to find, broaden to related educational content from trusted channels.
Example: If "Advanced React Hooks" is not found, suggest "React Tutorial" from freeCodeCamp.
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
    
    // Validate and normalize all video URLs
    const validatedVideos = output.videos
      .map(video => {
        let embedUrl = video.youtubeEmbedUrl;
        let isPlaylist = video.isPlaylist;

        // Ensure proper embed URL format
        if (!embedUrl.includes('/embed/')) {
          // Try to convert various URL formats to embed
          if (embedUrl.includes('watch?v=')) {
            const videoId = embedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1];
            if (videoId) {
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
              isPlaylist = false;
            }
          } else if (embedUrl.includes('youtu.be/')) {
            const videoId = embedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1];
            if (videoId) {
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
              isPlaylist = false;
            }
          } else if (embedUrl.includes('playlist?list=')) {
            const listId = embedUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/)?.[1];
            if (listId) {
              embedUrl = `https://www.youtube.com/embed/videoseries?list=${listId}`;
              isPlaylist = true;
            }
          }
        }

        // Validate final embed URL format
        const isValidEmbed = embedUrl.includes('youtube.com/embed/') && 
          (embedUrl.match(/\/embed\/[a-zA-Z0-9_-]{11}$/) || 
           embedUrl.match(/\/embed\/videoseries\?list=[a-zA-Z0-9_-]+$/));

        if (!isValidEmbed) {
          return null; // Invalid URL, will be filtered out
        }

        // Auto-detect playlist if not specified
        if (isPlaylist === undefined) {
          isPlaylist = embedUrl.includes('videoseries?list=');
        }

        return {
          ...video,
          youtubeEmbedUrl: embedUrl,
          isPlaylist: !!isPlaylist,
          title: video.title || (isPlaylist ? 'YouTube Playlist' : 'YouTube Video'),
          creator: video.creator || 'Unknown Creator'
        };
      })
      .filter(video => video !== null); // Remove invalid videos

    return { videos: validatedVideos };
  }
);
