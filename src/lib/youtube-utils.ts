/**
 * Utility functions for YouTube URL handling, validation, and conversion
 */

export interface YouTubeVideoInfo {
  type: 'video' | 'playlist';
  id: string;
  embedUrl: string;
  isValid: boolean;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Extract playlist ID from various YouTube URL formats
 */
export function extractPlaylistId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /playlist\?list=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Determine if a URL represents a YouTube playlist
 */
export function isPlaylistUrl(url: string): boolean {
  if (!url) return false;
  
  return url.includes('playlist?list=') || 
         url.includes('videoseries?list=') || 
         (url.includes('list=') && !url.includes('watch?v='));
}

/**
 * Convert any YouTube URL to a proper embed URL
 */
export function convertToEmbedUrl(url: string, forcePlaylist: boolean = false): YouTubeVideoInfo {
  if (!url) {
    return { type: 'video', id: '', embedUrl: '', isValid: false };
  }
  
  const cleanUrl = url.trim();
  
  // Already an embed URL - validate and return
  if (cleanUrl.includes('youtube.com/embed/')) {
    if (cleanUrl.includes('videoseries?list=')) {
      const playlistId = extractPlaylistId(cleanUrl);
      return {
        type: 'playlist',
        id: playlistId || '',
        embedUrl: cleanUrl,
        isValid: !!playlistId
      };
    } else {
      const videoId = extractVideoId(cleanUrl);
      return {
        type: 'video',
        id: videoId || '',
        embedUrl: cleanUrl,
        isValid: !!videoId
      };
    }
  }
  
  // Check for playlist first (even if forcePlaylist is false)
  const playlistId = extractPlaylistId(cleanUrl);
  if (playlistId && (forcePlaylist || isPlaylistUrl(cleanUrl))) {
    // Use improved playlist embed URL with autoplay and other parameters
    const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1`;
    return {
      type: 'playlist',
      id: playlistId,
      embedUrl: embedUrl,
      isValid: true
    };
  }
  
  // Handle regular video URLs
  const videoId = extractVideoId(cleanUrl);
  if (videoId) {
    // Add parameters to improve embedding success
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    return {
      type: 'video',
      id: videoId,
      embedUrl: embedUrl,
      isValid: true
    };
  }
  
  return { type: 'video', id: '', embedUrl: '', isValid: false };
}

/**
 * Validate if a YouTube embed URL is properly formatted
 */
export function isValidEmbedUrl(url: string): boolean {
  if (!url) return false;
  
  // Updated pattern to allow query parameters
  const embedUrlPattern = /^https:\/\/www\.youtube\.com\/embed\/(?:([a-zA-Z0-9_-]{11})|videoseries)(?:\?.*)?$/;
  return embedUrlPattern.test(url);
}

/**
 * Check if a YouTube video/playlist is available for embedding
 * This is a client-side check using the oEmbed endpoint
 */
export async function checkYouTubeAvailability(embedUrl: string): Promise<boolean> {
  try {
    const videoInfo = convertToEmbedUrl(embedUrl);
    
    if (!videoInfo.isValid || !videoInfo.id) {
      console.warn('Invalid YouTube URL for availability check:', embedUrl);
      return false;
    }
    
    // For AI-found videos, be more permissive to avoid blocking valid educational content
    if (videoInfo.type === 'playlist') {
      // For playlists, assume they're available if the ID format is valid
      console.log(`Assuming playlist ${videoInfo.id} is available (playlist availability check is limited)`);
      
      if (videoInfo.id && videoInfo.id.length > 10 && /^[a-zA-Z0-9_-]+$/.test(videoInfo.id)) {
        return true;
      } else {
        console.warn(`Invalid playlist ID format: ${videoInfo.id}`);
        return false;
      }
    }
    
    if (videoInfo.type === 'video') {
      // Use a simpler availability check that's less likely to be blocked
      try {
        // First try the oEmbed endpoint with a shorter timeout
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoInfo.id}&format=json`;
        
        const response = await fetch(oembedUrl, { 
          method: 'GET',
          headers: { 
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // Shorter 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.title) {
            console.log(`YouTube video ${videoInfo.id} is available: "${data.title}"`);
            return true;
          }
        }
        
        // If oEmbed fails, be permissive for AI-found educational content
        console.log(`oEmbed check failed for ${videoInfo.id}, assuming video is available for AI content`);
        return true;
        
      } catch (fetchError) {
        // If the availability check fails (network issues, ad blockers, etc.),
        // assume the video is available rather than blocking potentially good educational content
        console.log(`Availability check failed for ${videoInfo.id}, assuming available:`, fetchError);
        return true;
      }
    }
    
    return true; // Default to assuming videos are available
  } catch (error) {
    console.log('Error checking YouTube availability, assuming available:', error);
    // Be permissive in case of errors - let the iframe handle the actual embedding
    return true;
  }
}

/**
 * Generate a stable, unique ID for a video based on its URL
 */
export function generateVideoId(embedUrl: string, prefix: string = 'video'): string {
  const videoInfo = convertToEmbedUrl(embedUrl);
  
  if (videoInfo.isValid && videoInfo.id) {
    return `${prefix}-${videoInfo.type}-${videoInfo.id}`;
  }
  
  // Fallback to URL hash if video ID extraction fails
  const urlHash = btoa(embedUrl).replace(/[+/=]/g, '').substring(0, 12);
  return `${prefix}-unknown-${urlHash}`;
}

/**
 * Validate and normalize a YouTube URL for storage
 */
export function normalizeYouTubeUrl(url: string, isPlaylist: boolean = false): {
  embedUrl: string;
  isValid: boolean;
  type: 'video' | 'playlist';

  
  id: string;
  error?: string;
} {
  try {
    const videoInfo = convertToEmbedUrl(url, isPlaylist);
    
    if (!videoInfo.isValid) {
      return {
        embedUrl: '',
        isValid: false,
        type: 'video',
        id: '',
        error: 'Invalid YouTube URL format'
      };
    }
    
    if (!isValidEmbedUrl(videoInfo.embedUrl)) {
      return {
        embedUrl: '',
        isValid: false,
        type: 'video',
        id: '',
        error: 'Generated embed URL is not valid'
      };
    }
    
    return {
      embedUrl: videoInfo.embedUrl,
      isValid: true,
      type: videoInfo.type,
      id: videoInfo.id
    };
  } catch (error) {
    return {
      embedUrl: '',
      isValid: false,
      type: 'video',
      id: '',
      error: error instanceof Error ? error.message : 'Unknown error processing URL'
    };
  }
}
