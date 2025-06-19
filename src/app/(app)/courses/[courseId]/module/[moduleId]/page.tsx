'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { fetchYoutubePlaylistItems } from '@/ai/flows/fetch-youtube-playlist-items-flow';
import { Video, BookOpen, Clock, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our modular components
import { LoadingState } from '@/components/module/loading-state';
import { ContentNotFound } from '@/components/module/content-not-found';
import { MobileHeader } from '@/components/module/mobile-header';
import { VideoListPanel } from '@/components/module/VideoListPanel';
import { DocumentListPanel } from '@/components/module/DocumentListPanel';
import { EnhancedDocumentViewer } from '@/components/enhanced-document-viewer';
import { PlaylistSection } from '@/components/module/playlist-section';

// Import utilities and API functions
import { 
  VideoItem, 
  VideoState, 
  DocumentState,
  Course, 
  Module,
  fetchCourseData, 
  fetchVideoState,
  fetchDocumentState,
  addCustomVideo, 
  addCustomDocument,
  searchAIVideos,
  searchAIDocuments,
  removeVideo,
  removeDocument,
  renameVideo
} from '@/lib/module-api';

import {
  validateYouTubeUrl,
  isPlaylistUrl,
  extractPlaylistId,
  convertToEmbedUrl,
  generateThumbnail,
  extractVideoId
} from '@/lib/video-utils';

// Types
interface PlaylistItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

interface Playlist {
  id: string;
  title: string;
  videos: VideoItem[];
  type: 'module' | 'ai-search' | 'custom';
}

interface VideoSnippet {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    resourceId: {
      videoId: string;
    };
  };
}

interface PlayingVideo {
  videoId: string;
  playlistId?: string;
  playlistTitle?: string;
  playlistCreator?: string;
  customName?: string;
}

// Import document types from types.ts
import { CourseDocument, DocumentNote, DocumentHighlight } from '@/lib/types';

// Document collection for organizing documents
interface DocumentCollection {
  id: string;
  title: string;
  documents: CourseDocument[];
  type: 'module' | 'ai-search' | 'custom';
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get course and module IDs from URL params
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  // State management
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [videoState, setVideoState] = useState<VideoState>({
    customVideos: [],
    aiVideos: [],
    aiSearchCount: 0
  });
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  // Document state
  const [documentState, setDocumentState] = useState<DocumentState>({
    customDocuments: [],
    aiDocuments: [],
    aiSearchCount: 0
  });
  const [currentDocument, setCurrentDocument] = useState<CourseDocument | null>(null);
  const [documentCollections, setDocumentCollections] = useState<DocumentCollection[]>([]);
  const [aiDocumentSearchQuery, setAiDocumentSearchQuery] = useState('');
  const [aiDocumentSearchLoading, setAiDocumentSearchLoading] = useState(false);
  const [customDocumentUrl, setCustomDocumentUrl] = useState('');
  const [customDocumentLoading, setCustomDocumentLoading] = useState(false);

  // UI Tabs State
  const [activeTab, setActiveTab] = useState<'video' | 'document'>('video');
  
  // Search and Custom URL State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlLoading, setCustomUrlLoading] = useState(false);
  const [customVideoName, setCustomVideoName] = useState('');
  
  // Playlist state for current playing video
  const [playingVideo, setPlayingVideo] = useState<PlayingVideo | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<VideoSnippet[]>([]);
  const [loadingPlaylistData, setLoadingPlaylistData] = useState(false);
  const [playlistCurrentPage, setPlaylistCurrentPage] = useState(1);
  const [playlistVideosPerPage] = useState(20);
  
  // Admin limits state
  const [maxCustomVideos, setMaxCustomVideos] = useState(3);
  const [maxAiSearches, setMaxAiSearches] = useState(2);
  const [limitsLoading, setLimitsLoading] = useState(false);

  // Missing state variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [playlistItemsCache, setPlaylistItemsCache] = useState<{[key: string]: VideoItem[]}>({});
  const [loadingPlaylistItems, setLoadingPlaylistItems] = useState<{[key: string]: boolean}>({});
  const [expandedPlaylistItems, setExpandedPlaylistItems] = useState<{[key: string]: boolean}>({});

  // Pagination info for playlist videos
  const getPlaylistPaginationInfo = useMemo(() => {
    const totalVideos = playlistVideos.length;
    const totalPages = Math.ceil(totalVideos / playlistVideosPerPage);
    const startIndex = (playlistCurrentPage - 1) * playlistVideosPerPage;
    const endIndex = startIndex + playlistVideosPerPage;
    const currentPageVideos = playlistVideos.slice(startIndex, endIndex);
    
    return {
      totalVideos,
      totalPages,
      startIndex,
      endIndex,
      currentPageVideos,
      showingFrom: totalVideos > 0 ? startIndex + 1 : 0,
      showingTo: Math.min(endIndex, totalVideos)
    };
  }, [playlistVideos, playlistCurrentPage, playlistVideosPerPage]);
  // Reset pagination when playlist changes and jump to current video page
  useEffect(() => {
    if (playlistVideos.length > 0 && currentVideo && playingVideo?.playlistId) {
      // Find the index of the current video in the playlist
      const currentVideoIndex = playlistVideos.findIndex(
        video => video.snippet.resourceId.videoId === currentVideo.id
      );
      
      if (currentVideoIndex !== -1) {
        // Calculate which page contains the current video
        const pageContainingCurrentVideo = Math.floor(currentVideoIndex / playlistVideosPerPage) + 1;
        setPlaylistCurrentPage(pageContainingCurrentVideo);
      } else {
        setPlaylistCurrentPage(1);
      }
    } else {
      setPlaylistCurrentPage(1);
    }
  }, [playlistVideos, currentVideo?.id, playingVideo?.playlistId, playlistVideosPerPage]);
  // Check if current video is from a playlist and get playlist info
  const currentVideoPlaylist = useMemo(() => {
    if (!currentVideo) return null;
    
    // Check if we have playlist videos loaded and current video is from a playlist
    if (playlistVideos.length > 0 && playingVideo?.playlistId) {
      // Convert playlist video snippets to VideoItems for the PlaylistSection
      const playlistVideoItems: VideoItem[] = playlistVideos.map((snippet) => ({
        id: snippet.snippet.resourceId?.videoId || `${snippet.id}`,
        title: snippet.snippet.title || 'Untitled Video',
        url: `https://www.youtube.com/watch?v=${snippet.snippet.resourceId?.videoId}`,
        thumbnail: snippet.snippet.thumbnails?.medium?.url || snippet.snippet.thumbnails?.default?.url,
        duration: "0",
        source: 'playlist-item' as const,
        addedAt: new Date().toISOString(),
        playlistId: playingVideo.playlistId,
        creator: playingVideo.playlistCreator || 'YouTube'
      }));

      // Find current video index in playlist
      const currentIndex = playlistVideoItems.findIndex(video => 
        video.id === currentVideo.id || 
        video.url === currentVideo.url ||
        extractVideoId(video.url || '') === extractVideoId(currentVideo.url || '')
      );

      return {
        id: playingVideo.playlistId,
        title: playingVideo.playlistTitle || `YouTube Playlist ${playingVideo.playlistId}`,
        videos: playlistVideoItems,
        currentIndex: Math.max(0, currentIndex)
      };
    }
    
    return null;
  }, [currentVideo, playlistVideos, playingVideo]);// Fetch YouTube playlist info and items
  const fetchPlaylistItems = useCallback(async (playlistId: string) => {
    setLoadingPlaylistData(true);
    try {
      const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!YOUTUBE_API_KEY) {
        console.warn('YouTube API key not configured');
        return;
      }

      // First, fetch playlist details to get the actual title
      const playlistInfoUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
      const playlistInfoResponse = await fetch(playlistInfoUrl);
      
      let playlistTitle = `YouTube Playlist ${playlistId}`;
      let playlistCreator = 'YouTube';
      
      if (playlistInfoResponse.ok) {
        const playlistData = await playlistInfoResponse.json();
        if (playlistData.items && playlistData.items.length > 0) {
          playlistTitle = playlistData.items[0].snippet.title || playlistTitle;
          playlistCreator = playlistData.items[0].snippet.channelTitle || playlistCreator;
        }
      }

      let allVideoSnippets: VideoSnippet[] = [];
      let nextPageToken = '';
      let hasMorePages = true;

      // Fetch all pages of playlist items
      while (hasMorePages) {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch playlist items');
        }

        const data = await response.json();
        const videoSnippets: VideoSnippet[] = data.items?.map((item: any) => ({
          id: item.id,
          snippet: item.snippet
        })) || [];

        allVideoSnippets = [...allVideoSnippets, ...videoSnippets];
        
        // Check if there are more pages
        nextPageToken = data.nextPageToken || '';
        hasMorePages = !!nextPageToken;
        
        // Optional: Add a reasonable limit to prevent infinite loops
        if (allVideoSnippets.length >= 1000) {
          console.warn('Playlist too large, limiting to first 1000 videos');
          break;
        }
      }

      console.log(`Fetched ${allVideoSnippets.length} videos from playlist ${playlistId}`);
      setPlaylistVideos(allVideoSnippets);
      
      // Update the playing video with the actual playlist title and creator
      setPlayingVideo(prev => prev ? {
        ...prev,
        playlistTitle: playlistTitle,
        playlistCreator: playlistCreator
      } : null);
      
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      toast({
        title: "Error",
        description: "Failed to load playlist videos",
        variant: "destructive",
      });
    } finally {
      setLoadingPlaylistData(false);
    }
  }, [toast]);

  // Effect to fetch playlist items when playing video changes
  useEffect(() => {
    if (playingVideo?.playlistId) {
      fetchPlaylistItems(playingVideo.playlistId);
    } else {
      setPlaylistVideos([]);
    }
  }, [playingVideo?.playlistId, fetchPlaylistItems]);
  // Initialize course and video state
  useEffect(() => {
    const initializePageData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course data first
        const courseData = await fetchCourseData(courseId);
        if (!courseData) {
          setError('Course not found');
          return;
        }
        setCourse(courseData);

        // Find current module
        const module = courseData.modules.find(m => m.id === moduleId);
        if (!module) {
          setError('Module not found');
          return;
        }
        setCurrentModule(module);
        
        // Fetch video state (with better error handling for auth)
        try {
          // Fetch video state
          const videos = await fetchVideoState(courseId, moduleId);
          setVideoState(videos);
          updatePlaylists(videos, module);
          
          // Fetch document state
          try {
            const response = await fetch(`/api/documents/${courseId}/${moduleId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const documentData = await response.json();
              setDocumentState(documentData);
              updateDocumentCollections(documentData, module);
            }
          } catch (docError) {
            console.error('Failed to load document data:', docError);
            // Non-critical error, so we don't set the main error state
          }
          
          // Auto-select the first module video if available
          if (module.videoLinks && module.videoLinks.length > 0) {
            const firstVideo = {
              id: `module-0`,
              title: module.videoLinks[0].title || `Video 1`,
              url: module.videoLinks[0].youtubeEmbedUrl,
              youtubeEmbedUrl: module.videoLinks[0].youtubeEmbedUrl,
              thumbnail: module.videoLinks[0].thumbnail || generateThumbnail(module.videoLinks[0].youtubeEmbedUrl),
              source: 'module' as const,
              duration: module.videoLinks[0].duration || '',
              creator: module.videoLinks[0].creator || 'Course Content',
              language: 'English'
            };
            
            console.log('Auto-selecting first video:', firstVideo.title);
            setCurrentVideo(firstVideo);
          }
        } catch (videoError: any) {
          // If we get a 401 error, we'll still show the module with module videos
          // but indicate that authentication is required for custom/AI videos
          if (videoError.status === 401 || videoError.message?.includes('Unauthorized')) {
            console.log('User not authenticated, showing module videos only');
            setVideoState({
              customVideos: [],
              aiVideos: [],
              aiSearchCount: 0
            });
            updatePlaylists({
              customVideos: [],
              aiVideos: [],
              aiSearchCount: 0
            }, module);
            
            // Auto-select the first module video if available
            if (module.videoLinks && module.videoLinks.length > 0) {
              const firstVideo = {
                id: `module-0`,
                title: module.videoLinks[0].title || `Video 1`,
                url: module.videoLinks[0].youtubeEmbedUrl,
                youtubeEmbedUrl: module.videoLinks[0].youtubeEmbedUrl,
                thumbnail: module.videoLinks[0].thumbnail || generateThumbnail(module.videoLinks[0].youtubeEmbedUrl),
                source: 'module' as const,
                duration: module.videoLinks[0].duration || '',
                creator: module.videoLinks[0].creator || 'Course Content',
                language: 'English'
              };
              
              console.log('Auto-selecting first video (auth error):', firstVideo.title);
              setCurrentVideo(firstVideo);
            }
          } else {
            throw videoError;
          }
        }

      } catch (err) {
        console.error('Failed to initialize page data:', err);
        setError('Failed to load module data');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && moduleId) {
      initializePageData();
    }
  }, [courseId, moduleId]);

  // Fetch admin-configurable limits
  const fetchAdminLimits = useCallback(async () => {
    try {
      setLimitsLoading(true);
      const response = await fetch('/api/admin/limits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const limits = await response.json();
        setMaxCustomVideos(limits.maxCustomVideos || 3);
        setMaxAiSearches(limits.maxAiSearches || 2);
      } else {
        // If admin limits API fails, use default values
        console.log('Using default limits: custom videos = 3, AI searches = 2');
      }
    } catch (error) {
      console.error('Failed to fetch admin limits:', error);
      // Keep default values on error
    } finally {
      setLimitsLoading(false);
    }
  }, []);
  // Initialize admin limits on component mount
  useEffect(() => {
    fetchAdminLimits();
  }, [fetchAdminLimits]);
  
  
  // Update playlists when video state changes
  const updatePlaylists = useCallback((videos: VideoState, module: Module) => {
    const newPlaylists: Playlist[] = [];

    // Module videos playlist
    const moduleVideos = module.videoLinks?.map((link, index) => ({
      id: `module-${index}`,
      title: link.title || `Video ${index + 1}`,
      url: link.youtubeEmbedUrl,
      youtubeEmbedUrl: link.youtubeEmbedUrl,
      thumbnail: link.thumbnail || generateThumbnail(link.youtubeEmbedUrl),
      source: 'module' as const,
      duration: link.duration || '',
      creator: link.creator || 'Course Content',
      language: 'English'
    })) || [];

    if (moduleVideos.length > 0) {
      newPlaylists.push({
        id: 'module-videos',
        title: 'Module Videos',
        videos: moduleVideos,
        type: 'module'
      });
    }

    // AI search videos playlist
    if (videos.aiVideos.length > 0) {
      const aiVideosWithThumbnails = videos.aiVideos.map(video => ({
        ...video,
        source: 'ai' as const,
        thumbnail: video.thumbnail || generateThumbnail(video.youtubeEmbedUrl || video.url, video.url)
      }));
      
      newPlaylists.push({
        id: 'ai-videos',
        title: 'AI Suggested Videos',
        videos: aiVideosWithThumbnails,
        type: 'ai-search'
      });
    }

    // Custom videos playlist
    if (videos.customVideos.length > 0) {
      const customVideosWithThumbnails = videos.customVideos.map(video => ({
        ...video,
        source: 'custom' as const,
        thumbnail: video.thumbnail || generateThumbnail(video.youtubeEmbedUrl || video.url, video.url)
      }));
      
      newPlaylists.push({
        id: 'custom-videos',
        title: 'Your Videos',
        videos: customVideosWithThumbnails,
        type: 'custom'
      });
    }
    setPlaylists(newPlaylists);
  }, []);

  // Video player handlers (updated for YouTube iframe)
  const handlePlay = () => {
    setIsPlaying(true);    
    // Detect if current video is part of a playlist and set playing video state
    if (currentVideo) {
      const videoUrl = currentVideo.url || currentVideo.youtubeEmbedUrl;
      const playlistId = (videoUrl && isPlaylistUrl(videoUrl)) ? extractPlaylistId(videoUrl) : undefined;
      setPlayingVideo({
        videoId: currentVideo.id,
        playlistId: playlistId || undefined,
        playlistTitle: playlistId ? `Loading playlist...` : undefined,
        customName: currentVideo.title // Use the video title as default
      });
    }
  };
  
  // Automatically play the video when it's selected (including auto-selected)
  useEffect(() => {
    if (currentVideo && !isPlaying) {
      // Small delay to ensure the video component has mounted
      const timer = setTimeout(() => {
        handlePlay();
        console.log('Auto-playing video:', currentVideo.title);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentVideo, isPlaying]);

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // Note: iframe doesn't allow direct mute control
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Note: iframe doesn't allow direct volume control
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    // Note: iframe doesn't allow direct seek control
  };  const handleToggleFullscreen = () => {
    // Fullscreen will be handled by YouTube's iframe controls
  };

  // Video selection handler
  const handleVideoSelect = useCallback((video: VideoItem) => {
    console.log('[DEBUG] handleVideoSelect called with video:', {
      id: video.id,
      title: video.title,
      url: video.url,
      youtubeEmbedUrl: video.youtubeEmbedUrl,
      playlistId: video.playlistId,
      source: video.source
    });
    
    setCurrentVideo(video);
    
    // Check both url and youtubeEmbedUrl for playlist detection
    const videoUrl = video.url || video.youtubeEmbedUrl;
    
    // If it's a playlist video, fetch playlist items
    if (videoUrl && isPlaylistUrl(videoUrl)) {
      console.log('[DEBUG] Video is detected as playlist URL:', videoUrl);
      // Get playlist ID from video object or extract from URL
      const playlistId = video.playlistId || extractPlaylistId(videoUrl);
      console.log('[DEBUG] Extracted playlist ID:', playlistId);
      
      if (playlistId) {
        const cacheKey = `${video.id}-${playlistId}`;
        console.log('[DEBUG] Cache key:', cacheKey);
        console.log('[DEBUG] Cache exists?', !!playlistItemsCache[cacheKey]);
        console.log('[DEBUG] Loading?', !!loadingPlaylistItems[cacheKey]);
        
        if (!playlistItemsCache[cacheKey] && !loadingPlaylistItems[cacheKey]) {
          console.log('[DEBUG] Calling handlePlaylistItemsToggle');
          handlePlaylistItemsToggle(video.id, playlistId);
        } else {
          console.log('[DEBUG] Skipping playlist fetch - already cached or loading');
        }
      } else {
        console.log('[DEBUG] No playlist ID found');
      }
    } else {
      console.log('[DEBUG] Video is NOT a playlist URL, videoUrl:', videoUrl);
    }
  }, [playlistItemsCache, loadingPlaylistItems]);  // Handle playlist video selection from PlaylistSection
  const handlePlaylistVideoSelection = useCallback((video: VideoItem) => {
    // Use the main video selection handler which includes playlist detection
    handleVideoSelect(video);
  }, [handleVideoSelect]);

  // Handle playlist video selection (legacy for other uses)
  const handlePlaylistVideoSelect = useCallback((videoSnippet: VideoSnippet, playlistId: string) => {
    const newVideo: VideoItem = {
      id: videoSnippet.snippet.resourceId.videoId,
      title: videoSnippet.snippet.title,
      url: `https://www.youtube.com/watch?v=${videoSnippet.snippet.resourceId.videoId}`,
      thumbnail: videoSnippet.snippet.thumbnails.medium?.url || videoSnippet.snippet.thumbnails.default.url,
      duration: "0", // Will be set when video loads
      source: 'playlist-item',
      addedAt: new Date().toISOString(),
      playlistId
    };
    
    setCurrentVideo(newVideo);
    setPlayingVideo({
      videoId: newVideo.id,
      playlistId,
      playlistTitle: `YouTube Playlist ${playlistId}`
    });
  }, []);

  // Playlist items toggle handler
  const handlePlaylistItemsToggle = useCallback(async (videoId: string, playlistId: string) => {
    const cacheKey = `${videoId}-${playlistId}`;
    
    if (playlistItemsCache[cacheKey]) {
      // Already cached, just toggle expanded state
      setExpandedPlaylistItems(prev => ({
        ...prev,
        [cacheKey]: !prev[cacheKey]
      }));
      return;
    }

    // Fetch playlist items
    setLoadingPlaylistItems(prev => ({ ...prev, [cacheKey]: true }));
    
    try {
      const result = await fetchYoutubePlaylistItems({ playlistId });
      
      if (!result.items || result.error) {
        toast({
          title: "Error",
          description: result.error || "Failed to load playlist videos. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Convert playlist items to VideoItem format
      const playlistItems: VideoItem[] = result.items.map((item: PlaylistItem, index: number) => ({
        id: `playlist-item-${playlistId}-${item.videoId}`,
        title: item.title,
        url: `https://www.youtube.com/watch?v=${item.videoId}`,
        youtubeEmbedUrl: `https://www.youtube.com/embed/${item.videoId}`,
        thumbnail: item.thumbnailUrl,
        source: 'playlist-item' as const,
        videoId: item.videoId,
        playlistId: playlistId,
        duration: '',
        creator: 'YouTube',
        language: 'Unknown'
      }));
      
      setPlaylistItemsCache(prev => ({
        ...prev,
        [cacheKey]: playlistItems
      }));
      
      setExpandedPlaylistItems(prev => ({
        ...prev,
        [cacheKey]: true
      }));
      
    } catch (error) {
      console.error('Failed to fetch playlist items:', error);
      toast({
        title: "Error",
        description: "Failed to load playlist videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlaylistItems(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [expandedPlaylistItems, playlistItemsCache, toast]);
  // AI Search handler
  const handleAiSearch = useCallback(async () => {
    if (!aiSearchQuery.trim() || aiSearchLoading || videoState.aiSearchCount >= maxAiSearches) return;

    setAiSearchLoading(true);
    try {
      const updatedVideoState = await searchAIVideos(courseId, moduleId, aiSearchQuery.trim());
      setVideoState(updatedVideoState);
      updatePlaylists(updatedVideoState, currentModule!);
      
      toast({
        title: "Success",
        description: `Found ${updatedVideoState.aiVideos.length} AI suggested videos`,
      });
      
      setAiSearchQuery('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search for videos",
        variant: "destructive",
      });
    } finally {
      setAiSearchLoading(false);
    }
  }, [aiSearchQuery, aiSearchLoading, videoState.aiSearchCount, maxAiSearches, courseId, moduleId, currentModule, toast, updatePlaylists]);
  // Helper function to get better video title and thumbnail
  const getVideoMetadata = useCallback(async (url: string) => {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return {
        title: isPlaylistUrl(url) ? 'YouTube Playlist' : 'Custom Video',
        thumbnail: '',
        creator: 'YouTube'
      };
    }

    // Generate thumbnail
    const thumbnail = generateThumbnail(convertToEmbedUrl(url), url);
    
    // Try to get a better title based on video ID
    const betterTitle = isPlaylistUrl(url) 
      ? 'YouTube Playlist' 
      : `YouTube Video (${videoId.substring(0, 8)})`;
    
    return {
      title: betterTitle,
      thumbnail: thumbnail,
      creator: 'YouTube'
    };  }, []);

  // Add custom URL handler
  const handleAddCustomUrl = useCallback(async () => {
    if (!customUrl.trim() || customUrlLoading) return;

    if (!validateYouTubeUrl(customUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube video or playlist URL",
        variant: "destructive",
      });
      return;
    }

    setCustomUrlLoading(true);
    try {
      // Get better video metadata
      const metadata = await getVideoMetadata(customUrl.trim());

      const videoData = {
        url: customUrl.trim(),
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        language: 'English',
        creator: metadata.creator
      };

      const updatedVideoState = await addCustomVideo(courseId, moduleId, videoData);
      setVideoState(updatedVideoState);
      updatePlaylists(updatedVideoState, currentModule!);

      toast({
        title: "Success",
        description: isPlaylistUrl(customUrl) ? "Playlist added successfully" : "Video added successfully",
      });

      setCustomUrl('');
    } catch (error: any) {      toast({
        title: "Error",
        description: error.message || "Failed to add video",
        variant: "destructive",
      });
    } finally {
      setCustomUrlLoading(false);
    }
  }, [customUrl, customUrlLoading, getVideoMetadata, courseId, moduleId, currentModule, toast, updatePlaylists]);

  // Remove video handler
  const handleRemoveVideo = useCallback(async (videoId: string) => {
    try {
      const updatedVideoState = await removeVideo(courseId, moduleId, videoId);
      setVideoState(updatedVideoState);
      updatePlaylists(updatedVideoState, currentModule!);

      // If the removed video was currently playing, clear it
      if (currentVideo?.id === videoId) {
        setCurrentVideo(null);
      }

      toast({
        title: "Success",
        description: "Video removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove video",
        variant: "destructive",
      });
    }
  }, [courseId, moduleId, currentModule, currentVideo, toast, updatePlaylists]);
  // Rename video handler
  const handleRenameVideo = useCallback(async (videoId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      toast({
        title: "Error",
        description: "Video title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call the API to rename the video persistently
      const updatedVideoState = await renameVideo(courseId, moduleId, videoId, newTitle.trim());
      setVideoState(updatedVideoState);
      updatePlaylists(updatedVideoState, currentModule!);

      // Update the current video if it's the one being renamed
      if (currentVideo?.id === videoId) {
        setCurrentVideo({ ...currentVideo, title: newTitle.trim() });
      }

      toast({
        title: "Success",
        description: "Video renamed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to rename video",
        variant: "destructive",
      });
    }
  }, [courseId, moduleId, currentModule, currentVideo, toast, updatePlaylists]);
  // Document operation handlers
  const handleAiDocumentSearch = useCallback(async () => {
    if (!aiDocumentSearchQuery.trim() || aiDocumentSearchLoading) return;
    
    if (documentState.aiSearchCount >= maxAiSearches) {
      toast({
        title: "Limit Reached",
        description: `You can only perform ${maxAiSearches} AI document searches per module`,
        variant: "destructive",
      });
      return;
    }

    setAiDocumentSearchLoading(true);
    try {
      // Call API to search for documents
      const response = await fetch(`/api/documents/ai-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: aiDocumentSearchQuery,
          courseId,
          moduleId,
          count: 3 // Number of documents to return
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to search documents: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update document state with new AI documents
      const newDocumentState: DocumentState = {
        ...documentState,
        aiDocuments: [...documentState.aiDocuments, ...data.documents],
        aiSearchCount: documentState.aiSearchCount + 1
      };
      
      setDocumentState(newDocumentState);
      updateDocumentCollections(newDocumentState, currentModule!);
      
      toast({
        title: "Success",
        description: `Found ${data.documents.length} relevant documents`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search documents",
        variant: "destructive",
      });
    } finally {
      setAiDocumentSearchLoading(false);
    }
  }, [aiDocumentSearchQuery, documentState, maxAiSearches, courseId, moduleId, toast]);

  // Add custom document link handler
  const handleAddCustomDocument = useCallback(async () => {
    if (!customDocumentUrl.trim() || customDocumentLoading) return;
    
    setCustomDocumentLoading(true);
    try {
      // Call API to add custom document
      const response = await fetch(`/api/documents/add-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: customDocumentUrl.trim(),
          courseId,
          moduleId,
          name: `Custom Document ${documentState.customDocuments.length + 1}`,
          type: customDocumentUrl.endsWith('.pdf') ? 'pdf' : 
                customDocumentUrl.endsWith('.docx') ? 'docx' :
                customDocumentUrl.endsWith('.doc') ? 'doc' : 'txt'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add document: ${response.statusText}`);
      }

      const newDocument = await response.json();
      
      // Update document state with new custom document
      const newDocumentState: DocumentState = {
        ...documentState,
        customDocuments: [...documentState.customDocuments, newDocument]
      };
      
      setDocumentState(newDocumentState);
      updateDocumentCollections(newDocumentState, currentModule!);
      
      toast({
        title: "Success",
        description: "Document added successfully",
      });
      
      setCustomDocumentUrl('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add document",
        variant: "destructive",
      });
    } finally {
      setCustomDocumentLoading(false);
    }
  }, [customDocumentUrl, customDocumentLoading, documentState, courseId, moduleId, toast, currentModule]);

  // Remove document handler
  const handleRemoveDocument = useCallback(async (documentId: string) => {
    try {
      // Call API to remove document
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to remove document: ${response.statusText}`);
      }

      // Update document state by removing the document
      const newDocumentState: DocumentState = {
        ...documentState,
        customDocuments: documentState.customDocuments.filter(doc => doc.id !== documentId),
        aiDocuments: documentState.aiDocuments.filter(doc => doc.id !== documentId)
      };
      
      setDocumentState(newDocumentState);
      updateDocumentCollections(newDocumentState, currentModule!);
      
      // If the removed document was currently displayed, clear it
      if (currentDocument?.id === documentId) {
        setCurrentDocument(null);
      }

      toast({
        title: "Success",
        description: "Document removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove document",
        variant: "destructive",
      });
    }
  }, [documentState, currentModule, currentDocument, toast]);
  // Update document collections when document state changes
  const updateDocumentCollections = useCallback((docState: DocumentState, module: Module) => {
    const newDocumentCollections: DocumentCollection[] = [];

    // Module documents collection
    if ((module as any).documents && (module as any).documents.length > 0) {
      newDocumentCollections.push({
        id: 'module-documents',
        title: 'Module Documents',
        documents: (module as any).documents,
        type: 'module'
      });
    }

    // AI suggested documents collection
    if (docState.aiDocuments.length > 0) {
      newDocumentCollections.push({
        id: 'ai-documents',
        title: 'AI Suggested Documents',
        documents: docState.aiDocuments,
        type: 'ai-search'
      });
    }

    // Custom documents collection
    if (docState.customDocuments.length > 0) {
      newDocumentCollections.push({
        id: 'custom-documents',
        title: 'Your Documents',
        documents: docState.customDocuments,
        type: 'custom'
      });
    }

    setDocumentCollections(newDocumentCollections);
  }, []);
    // Show loading or error states
  if (loading || error) {
    return <LoadingState loading={loading} error={error} />;
  }

  // Show content not found
  if (!course || !currentModule) {
    return <ContentNotFound course={course} currentModule={currentModule} />;
  }

  // Return the rendered content
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Header */}
      <MobileHeader
        currentModuleTitle={currentModule.title}
        totalVideoCount={playlists.reduce((acc, p) => acc + p.videos.length, 0)}
        onOpenVideoSidebar={() => setLeftSidebarOpen(true)}
        onOpenCourseSidebar={() => setRightSidebarOpen(true)}
      />
      
      {/* Enhanced Layout: Content Player + Content List + Course Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[5fr_3fr] gap-6 min-h-[calc(100vh-8rem)]">
          {/* Content Column: Player + List Panel */}
          <div className="flex flex-col space-y-6">
            {/* Tab Navigation */}
            <Tabs defaultValue="video" className="w-full" onValueChange={(value) => setActiveTab(value as 'video' | 'document')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="video" className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Doc</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Video Tab Content */}
              <TabsContent value="video" className="m-0">
                <main className="bg-slate-900 rounded-lg overflow-hidden shadow-lg" aria-label="Video Player">
                  {currentVideo ? (
                    <div className="w-full">
                      {/* YouTube Video Player */}
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
                        <iframe
                          style={{ border: 0 }}
                          className="absolute top-0 left-0 w-full h-full"
                          src={currentVideo.youtubeEmbedUrl || convertToEmbedUrl(currentVideo.url)}
                          title={currentVideo.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          onLoad={() => {
                            // Trigger play event when iframe loads
                            handlePlay();
                          }}
                        />
                      </div>
                        {/* Dynamic Playlist Panel - appears below video when playlist is detected */}
                      {currentVideoPlaylist && (
                        <div className="bg-slate-800 border-t border-slate-700">
                          <PlaylistSection
                            playlist={currentVideoPlaylist}
                            currentVideo={currentVideo}
                            onVideoSelect={handlePlaylistVideoSelection}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <Video className="w-8 h-8" />
                      </div>
                      <p className="text-lg font-medium">Select a video to play</p>
                      <p className="text-sm text-gray-500 mt-1">Choose from module videos, AI suggestions, or your custom videos below</p>
                    </div>
                  )}
                </main>
                
                {/* Video List Panel */}
                <div className="transition-all duration-300">
                  <VideoListPanel
                    playlists={playlists}
                    currentVideo={currentVideo}
                    videoState={videoState}
                    user={user}
                    aiSearchQuery={aiSearchQuery}
                    aiSearchLoading={aiSearchLoading}
                    customUrl={customUrl}
                    customUrlLoading={customUrlLoading}
                    loading={loading}
                    maxCustomVideos={maxCustomVideos}
                    maxAiSearches={maxAiSearches}
                    onVideoSelect={handleVideoSelect}
                    onRemoveVideo={handleRemoveVideo}
                    onRenameVideo={handleRenameVideo}
                    onSetAiSearchQuery={setAiSearchQuery}
                    onAiSearch={handleAiSearch}
                    onSetCustomUrl={setCustomUrl}
                    onAddCustomUrl={handleAddCustomUrl}
                    validateYouTubeUrl={validateYouTubeUrl}
                    isPlaylistUrl={isPlaylistUrl}
                  />
                </div>
              </TabsContent>
              
              {/* Document Tab Content */}
              <TabsContent value="document" className="m-0">
                <main className="bg-slate-900 rounded-lg overflow-hidden shadow-lg" aria-label="Document Viewer">
                  {currentDocument ? (
                    <div className="w-full">
                      {/* Enhanced Document Viewer */}
                      <EnhancedDocumentViewer
                        document={{
                          id: currentDocument.id,
                          name: currentDocument.name || currentDocument.originalName,
                          originalName: currentDocument.originalName,
                          type: currentDocument.type,
                          url: currentDocument.url,
                          size: currentDocument.size,
                          uploadedAt: currentDocument.uploadedAt
                        }}
                        userId={user?.id || ''}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-lg font-medium">Select a document to view</p>
                      <p className="text-sm text-gray-500 mt-1">Choose from module documents, AI suggestions, or upload your own below</p>
                    </div>
                  )}
                </main>
                
                {/* Document List Panel */}
                <div className="transition-all duration-300">
                  <DocumentListPanel
                    documentCollections={documentCollections}
                    currentDocument={currentDocument}
                    documentState={documentState}
                    aiSearchQuery={aiDocumentSearchQuery}
                    aiSearchLoading={aiDocumentSearchLoading}
                    customLinkUrl={customDocumentUrl}
                    customLinkLoading={customDocumentLoading}
                    loading={loading}
                    maxCustomDocuments={maxCustomVideos}
                    maxAiSearches={maxAiSearches}
                    userId={user?.id || ''}
                    courseId={courseId}
                    moduleId={moduleId}
                    onDocumentSelect={(doc) => setCurrentDocument(doc)}
                    onRemoveDocument={handleRemoveDocument}
                    onSetAiSearchQuery={(query) => setAiDocumentSearchQuery(query)}
                    onAiSearch={handleAiDocumentSearch}
                    onSetCustomLinkUrl={(url) => setCustomDocumentUrl(url)}
                    onAddCustomLink={handleAddCustomDocument}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column: Course Navigation */}
          <aside className="bg-slate-800 rounded-lg shadow-lg overflow-hidden h-fit" aria-label="Course Navigation">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                Course Modules
              </h3>
              <p className="text-xs text-gray-400 mt-1">{course.title}</p>
            </div>
            <div className="p-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="space-y-2">
                {course.modules.map((module, index) => (
                  <button
                    key={module.id}
                    onClick={() => router.push(`/courses/${courseId}/module/${module.id}`)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 border ${
                      module.id === moduleId 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                        : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600 hover:border-slate-500'
                    }`}
                    aria-label={`Navigate to ${module.title}`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        module.id === moduleId 
                          ? 'bg-white text-blue-600' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{module.title}</p>
                        {module.estimatedTime && (
                          <p className="text-xs opacity-70 mt-0.5 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {module.estimatedTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Overlay for responsive behavior */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}
