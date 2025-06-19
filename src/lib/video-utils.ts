// Utility functions for video handling in the module page

export const validateYouTubeUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const patterns = [
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(?:www\.)?youtu\.be\/[\w-]+/,
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+/,
    /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=[\w-]+/
  ];
  
  return patterns.some(pattern => pattern.test(url));
};

export const isPlaylistUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return /[&?]list=[\w-]+/.test(url) || url.includes('/playlist?list=');
};

export const extractPlaylistId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  const match = url.match(/[&?]list=([\w-]+)/);
  return match ? match[1] : null;
};

export const extractVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // YouTube video ID patterns
  const patterns = [
    /[&?]v=([\w-]+)/,           // youtube.com/watch?v=
    /youtu\.be\/([\w-]+)/,      // youtu.be/
    /embed\/([\w-]+)/           // youtube.com/embed/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

export const convertToEmbedUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return url;
  
  // If already an embed URL, return as is
  if (url.includes('/embed/')) {
    return url;
  }
  
  const videoId = extractVideoId(url);
  if (!videoId) return url;
  
  // Convert to embed URL
  return `https://www.youtube.com/embed/${videoId}`;
};

export const generateThumbnail = (embedUrl: string, originalUrl?: string): string => {
  if (!embedUrl || typeof embedUrl !== 'string') return '';
  
  // For playlists, use YouTube playlist thumbnail scheme
  if (originalUrl && isPlaylistUrl(originalUrl)) {
    const playlistId = extractPlaylistId(originalUrl);
    if (playlistId) {
      // For playlists, use a more reliable default thumbnail
      return `https://i.ytimg.com/vi/default/${playlistId}/mqdefault.jpg`;
    }
  }
  
  // For URLs with embed path
  const embedMatch = embedUrl.match(/\/embed\/([^?&/]+)/);
  if (embedMatch && embedMatch[1]) {
    return `https://img.youtube.com/vi/${embedMatch[1]}/mqdefault.jpg`;
  }
  
  // For other URL formats
  const urlToCheck = originalUrl || embedUrl;
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  ];
  
  for (const pattern of patterns) {
    const match = urlToCheck.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    } else if (match && match[7] && match[7].length === 11) {
      return `https://img.youtube.com/vi/${match[7]}/mqdefault.jpg`;
    }
  }
  
  // For video IDs directly
  if (urlToCheck && urlToCheck.length === 11) {
    return `https://img.youtube.com/vi/${urlToCheck}/mqdefault.jpg`;
  }
  
  return '';
};

export const formatTime = (time: number): string => {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const generateVideoId = (url: string, source: string): string => {
  const videoId = extractVideoId(url);
  const timestamp = Date.now();
  return `${source}-${videoId || 'unknown'}-${timestamp}`;
};
