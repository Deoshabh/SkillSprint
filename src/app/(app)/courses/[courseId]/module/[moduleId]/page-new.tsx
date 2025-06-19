'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { fetchYoutubePlaylistItems } from '@/ai/flows/fetch-youtube-playlist-items-flow';

// Import our modular components
import { LoadingState } from '@/components/module/loading-state';
import { ContentNotFound } from '@/components/module/content-not-found';
import { MobileHeader } from '@/components/module/mobile-header';
import { ModuleLayout } from '@/components/module/module-layout';

// Import utilities and API functions
import { 
  VideoItem, 
  VideoState, 
  Course, 
  Module,
  fetchCourseData, 
  fetchVideoState, 
  addCustomVideo, 
  searchAIVideos, 
  removeVideo 
} from '@/lib/module-api';

import {
  validateYouTubeUrl,
  isPlaylistUrl,
  extractPlaylistId,
  convertToEmbedUrl,
  generateThumbnail,
  generateVideoId
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [expandedPlaylists, setExpandedPlaylists] = useState<string[]>(['module-videos']);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [expandedPlaylistItems, setExpandedPlaylistItems] = useState<Record<string, boolean>>({});
  const [loadingPlaylistItems, setLoadingPlaylistItems] = useState<Record<string, boolean>>({});
  const [playlistItemsCache, setPlaylistItemsCache] = useState<Record<string, VideoItem[]>>({});
  
  // Video Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Search and Custom URL State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlLoading, setCustomUrlLoading] = useState(false);

  // Check if current video is from a playlist and get playlist info
  const currentVideoPlaylist = useMemo(() => {
    if (!currentVideo) return null;
    
    // Check if current video is a playlist URL or has playlist items
    if (currentVideo.url && isPlaylistUrl(currentVideo.url) && currentVideo.playlistId) {
      const cacheKey = `${currentVideo.id}-${currentVideo.playlistId}`;
      const playlistItems = playlistItemsCache[cacheKey];
      if (playlistItems && playlistItems.length > 0) {
        return {
          id: currentVideo.playlistId,
          title: `Playlist: ${currentVideo.title}`,
          videos: playlistItems,
          currentIndex: playlistItems.findIndex(item => item.id === currentVideo.id)
        };
      }
    }
    return null;
  }, [currentVideo, playlistItemsCache]);

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

        // Fetch video state
        const videos = await fetchVideoState(courseId, moduleId);
        setVideoState(videos);

        // Update playlists
        updatePlaylists(videos, module);

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
      newPlaylists.push({
        id: 'ai-videos',
        title: 'AI Suggested Videos',
        videos: videos.aiVideos,
        type: 'ai-search'
      });
    }

    // Custom videos playlist
    if (videos.customVideos.length > 0) {
      newPlaylists.push({
        id: 'custom-videos',
        title: 'Your Videos',
        videos: videos.customVideos,
        type: 'custom'
      });
    }

    setPlaylists(newPlaylists);
  }, []);

  // Video player handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleToggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Video selection handler
  const handleVideoSelect = useCallback((video: VideoItem) => {
    setCurrentVideo(video);
    
    // If it's a playlist video, fetch playlist items
    if (video.url && isPlaylistUrl(video.url) && video.playlistId) {
      const cacheKey = `${video.id}-${video.playlistId}`;
      if (!playlistItemsCache[cacheKey] && !loadingPlaylistItems[cacheKey]) {
        handlePlaylistItemsToggle(video.id, video.playlistId);
      }
    }
  }, [playlistItemsCache, loadingPlaylistItems]);

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
    if (!aiSearchQuery.trim() || aiSearchLoading || videoState.aiSearchCount >= 2) return;

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
  }, [aiSearchQuery, aiSearchLoading, videoState.aiSearchCount, courseId, moduleId, currentModule, toast, updatePlaylists]);

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
      const videoData = {
        url: customUrl.trim(),
        title: isPlaylistUrl(customUrl) ? 'YouTube Playlist' : 'Custom Video',
        language: 'English',
        creator: 'YouTube'
      };

      const updatedVideoState = await addCustomVideo(courseId, moduleId, videoData);
      setVideoState(updatedVideoState);
      updatePlaylists(updatedVideoState, currentModule!);

      toast({
        title: "Success",
        description: isPlaylistUrl(customUrl) ? "Playlist added successfully" : "Video added successfully",
      });

      setCustomUrl('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add video",
        variant: "destructive",
      });
    } finally {
      setCustomUrlLoading(false);
    }
  }, [customUrl, customUrlLoading, courseId, moduleId, currentModule, toast, updatePlaylists]);

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

  const handleCloseSidebars = () => {
    setLeftSidebarOpen(false);
    setRightSidebarOpen(false);
  };

  // Calculate total video count for mobile header
  const totalVideoCount = playlists.reduce((acc, p) => acc + p.videos.length, 0);

  // Show loading or error states
  if (loading || error) {
    return <LoadingState loading={loading} error={error} />;
  }

  // Show content not found
  if (!course || !currentModule) {
    return <ContentNotFound course={course} currentModule={currentModule} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        {/* Mobile Header */}
        <MobileHeader
          currentModuleTitle={currentModule.title}
          totalVideoCount={totalVideoCount}
          onOpenVideoSidebar={() => setLeftSidebarOpen(true)}
          onOpenCourseSidebar={() => setRightSidebarOpen(true)}
        />

        {/* Main Module Layout */}
        <ModuleLayout
          currentVideo={currentVideo}
          currentModule={currentModule}
          course={course}
          courseId={courseId}
          moduleId={moduleId}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          onPlay={handlePlay}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
          onVolumeChange={handleVolumeChange}
          onSeek={handleSeek}
          onToggleFullscreen={handleToggleFullscreen}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          currentVideoPlaylist={currentVideoPlaylist}
          playlists={playlists}
          leftSidebarOpen={leftSidebarOpen}
          rightSidebarOpen={rightSidebarOpen}
          onCloseSidebars={handleCloseSidebars}
          videoState={videoState}
          expandedPlaylists={expandedPlaylists}
          expandedPlaylistItems={expandedPlaylistItems}
          loadingPlaylistItems={loadingPlaylistItems}
          playlistItemsCache={playlistItemsCache}
          aiSearchQuery={aiSearchQuery}
          aiSearchLoading={aiSearchLoading}
          customUrl={customUrl}
          customUrlLoading={customUrlLoading}
          onVideoSelect={handleVideoSelect}
          onTogglePlaylistItems={handlePlaylistItemsToggle}
          onRemoveVideo={handleRemoveVideo}
          onAiSearch={handleAiSearch}
          onAddCustomUrl={handleAddCustomUrl}
          onSetAiSearchQuery={setAiSearchQuery}
          onSetCustomUrl={setCustomUrl}
          onSetExpandedPlaylists={setExpandedPlaylists}
          onSetLeftSidebarOpen={setLeftSidebarOpen}
        />

        {/* Mobile Overlay */}
        {(leftSidebarOpen || rightSidebarOpen) && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={handleCloseSidebars}
          />
        )}
      </div>
    </div>
  );
}
