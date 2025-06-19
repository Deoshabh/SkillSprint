
'use server';
/**
 * @fileOverview A Genkit flow to fetch items from a YouTube playlist.
 *
 * - fetchYoutubePlaylistItems - Fetches video details from a given YouTube playlist ID.
 * - FetchYoutubePlaylistItemsInput - Input schema for the flow.
 * - FetchYoutubePlaylistItemsOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

const FetchYoutubePlaylistItemsInputSchema = z.object({
  playlistId: z.string().describe('The ID of the YouTube playlist to fetch items from.'),
});
export type FetchYoutubePlaylistItemsInput = z.infer<typeof FetchYoutubePlaylistItemsInputSchema>;

const PlaylistItemSchema = z.object({
  videoId: z.string().describe('The YouTube video ID.'),
  title: z.string().describe('The title of the video.'),
  thumbnailUrl: z.string().url().describe('The URL of the video thumbnail (medium quality).'),
});

const FetchYoutubePlaylistItemsOutputSchema = z.object({
  items: z.array(PlaylistItemSchema).describe('An array of video items from the playlist.'),
  error: z.string().optional().describe('An error message if fetching failed.'),
});
export type FetchYoutubePlaylistItemsOutput = z.infer<typeof FetchYoutubePlaylistItemsOutputSchema>;

export async function fetchYoutubePlaylistItems(
  input: FetchYoutubePlaylistItemsInput
): Promise<FetchYoutubePlaylistItemsOutput> {
  return fetchYoutubePlaylistItemsFlow(input);
}

const fetchYoutubePlaylistItemsFlow = ai.defineFlow(
  {
    name: 'fetchYoutubePlaylistItemsFlow',
    inputSchema: FetchYoutubePlaylistItemsInputSchema,
    outputSchema: FetchYoutubePlaylistItemsOutputSchema,
  },
  async ({ playlistId }) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY is not set in environment variables.');
      return { items: [], error: 'YouTube API key is not configured.' };
    }

    const allItems: z.infer<typeof PlaylistItemSchema>[] = [];
    let nextPageToken: string | undefined = undefined;
    const maxResultsPerPage = 50; // YouTube API max is 50

    try {
      do {
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResultsPerPage}&key=${apiKey}`;
        if (nextPageToken) {
          url += `&pageToken=${nextPageToken}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse API error response' })) as any;
          console.error(`YouTube API error: ${response.status} -`, errorData);
          const errorMessage = `YouTube API Error: ${response.status} ${errorData?.error?.message || response.statusText}`;
          // If some items were already fetched, return them with the error, otherwise just error
          return { items: allItems.length > 0 ? allItems : [], error: errorMessage };
        }

        const data = (await response.json()) as any;

        if (data.items && data.items.length > 0) {
          const playlistItemsBatch: z.infer<typeof PlaylistItemSchema>[] = data.items
            .filter((item: any) => item.snippet?.resourceId?.kind === 'youtube#video' && item.snippet?.resourceId?.videoId)
            .map((item: any) => ({
              videoId: item.snippet.resourceId.videoId,
              title: item.snippet.title,
              thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || 'https://placehold.co/320x180.png?text=No+Thumbnail',
            }));
          allItems.push(...playlistItemsBatch);
        }
        
        nextPageToken = data.nextPageToken;

      } while (nextPageToken);

      if (allItems.length === 0) {
        return { items: [], error: 'No items found in the playlist or playlist is private/invalid.' };
      }

      return { items: allItems };

    } catch (error) {
      console.error('Error fetching YouTube playlist items:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { items: allItems.length > 0 ? allItems : [], error: `Failed to fetch playlist items: ${errorMessage}` };
    }
  }
);
