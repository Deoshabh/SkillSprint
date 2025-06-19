'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Search,
  Plus,
  Menu,
  X,
  ChevronRight,
  Video,
  PlayCircle,
  BookOpen,
  Brain,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Clock,
  Globe
} from 'lucide-react';

// Types
interface VideoItem {
  id: string;
  title: string;
  url: string;
  youtubeEmbedUrl?: string;
  duration?: string;
  thumbnail?: string;
  source: 'module' | 'ai' | 'custom';
  creator?: string;
  language?: string;
  notes?: string;
  addedAt?: string;
}

interface Playlist {
  id: string;
  title: string;
  videos: VideoItem[];
  type: 'module' | 'ai-search' | 'custom';
  expanded?: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  order: number;
  isCompleted: boolean;
  contentUrl?: string;
  estimatedTime?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  modules: Module[];
}

interface VideoState {
  customVideos: VideoItem[];
  aiVideos: VideoItem[];
  aiSearchCount: number;
}

// Video API functions
const fetchVideoState = async (courseId: string, moduleId: string): Promise<VideoState> => {
  try {
    const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch video state:', error);
    return { customVideos: [], aiVideos: [], aiSearchCount: 0 };
  }
};

const addCustomVideo = async (courseId: string, moduleId: string, video: {
  url: string;
  title?: string;
  language?: string;
  creator?: string;
  notes?: string;
}): Promise<VideoState> => {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add video');
  }
  
  return await response.json();
};

const searchAIVideos = async (courseId: string, moduleId: string, query: string): Promise<VideoState> => {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos/search`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, maxResults: 3 })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search videos');
  }
  
  return await response.json();
};

const removeVideo = async (courseId: string, moduleId: string, videoId: string): Promise<VideoState> => {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove video');
  }
  
  return await response.json();
};

// Mock data for development and fallback
const mockCourse: Course = {
  id: 'course-1',
  title: 'Advanced React Development',
  description: 'Master modern React patterns and best practices',
  modules: [
    { 
      id: 'mod-1', 
      title: 'React Hooks Deep Dive', 
      courseId: 'course-1', 
      order: 1, 
      isCompleted: true,
      contentUrl: 'https://www.youtube.com/embed/TNhaISOUy6Q',
      estimatedTime: '2 hours'
    },
    { 
      id: 'mod-2', 
      title: 'State Management with Zustand', 
      courseId: 'course-1', 
      order: 2, 
      isCompleted: false,
      contentUrl: 'https://www.youtube.com/embed/O6P86uwfdR0',
      estimatedTime: '1.5 hours'
    },
    { 
      id: 'mod-3', 
      title: 'Performance Optimization', 
      courseId: 'course-1', 
      order: 3, 
      isCompleted: false,
      contentUrl: 'https://www.youtube.com/embed/6ThXsUwLWvc',
      estimatedTime: '3 hours'
    },
    { 
      id: 'mod-4', 
      title: 'Testing Strategies', 
      courseId: 'course-1', 
      order: 4, 
      isCompleted: false,
      estimatedTime: '2.5 hours'
    },
    { 
      id: 'mod-5', 
      title: 'Advanced Patterns', 
      courseId: 'course-1', 
      order: 5, 
      isCompleted: false,
      estimatedTime: '3 hours'
    }
  ]
};

// Utility functions
const validateYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
};

const convertToEmbedUrl = (url: string): string => {
  if (url.includes('/embed/')) return url;
  
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (videoIdMatch) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }
  
  const playlistMatch = url.match(/[&?]list=([^&\n?#]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
  }
  
  return url;
};

const generateThumbnail = (embedUrl: string): string => {
  const videoIdMatch = embedUrl.match(/\/embed\/([^?&]+)/);
  if (videoIdMatch) {
    return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
  }
  return '';
};

function ModuleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get course and module IDs from URL params
  const courseId = searchParams.get('courseId') || 'course-1';
  const moduleId = searchParams.get('moduleId') || 'mod-1';

  // State management
  const [videoState, setVideoState] = useState<VideoState>({
    customVideos: [],
    aiVideos: [],
    aiSearchCount: 0
  });
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [expandedPlaylists, setExpandedPlaylists] = useState<string[]>(['module-videos']);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  
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

  // Current module info
  const currentModule = useMemo(() => 
    mockCourse.modules.find(m => m.id === moduleId) || mockCourse.modules[0],
    [moduleId]
  );

  // Initialize video state and playlists
  useEffect(() => {
    const initializeVideoState = async () => {
      try {
        setLoading(true);
        const state = await fetchVideoState(courseId, moduleId);
        setVideoState(state);
        
        // Build playlists from video state
        const newPlaylists: Playlist[] = [];
        
        // Module Videos playlist
        const moduleVideos: VideoItem[] = [];
        if (currentModule.contentUrl) {
          moduleVideos.push({
            id: `module-default-${currentModule.id}`,
            title: `${currentModule.title} - Main Video`,
            url: currentModule.contentUrl,
            youtubeEmbedUrl: currentModule.contentUrl,
            source: 'module',
            duration: currentModule.estimatedTime,
            thumbnail: generateThumbnail(currentModule.contentUrl)
          });
        }
        
        if (moduleVideos.length > 0) {
          newPlaylists.push({
            id: 'module-videos',
            title: 'Module Videos',
            type: 'module',
            videos: moduleVideos
          });
        }
        
        // Custom Videos playlist
        if (state.customVideos.length > 0) {
          newPlaylists.push({
            id: 'custom-videos',
            title: 'Custom Videos',
            type: 'custom',
            videos: state.customVideos
          });
        }
        
        // AI Search Results playlist
        if (state.aiVideos.length > 0) {
          newPlaylists.push({
            id: 'ai-search-results',
            title: 'AI Search Results',
            type: 'ai-search',
            videos: state.aiVideos
          });
        }
        
        setPlaylists(newPlaylists);
        
        // Set initial video if available
        if (newPlaylists.length > 0 && newPlaylists[0].videos.length > 0) {
          setCurrentVideo(newPlaylists[0].videos[0]);
        }
        
      } catch (error) {
        console.error('Failed to initialize video state:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load video content. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeVideoState();
  }, [courseId, moduleId, currentModule, toast]);

  // Auto-expand playlist containing current video
  useEffect(() => {
    if (currentVideo) {
      const containingPlaylist = playlists.find(p => 
        p.videos.some(v => v.id === currentVideo.id)
      );
      if (containingPlaylist && !expandedPlaylists.includes(containingPlaylist.id)) {
        setExpandedPlaylists(prev => [...prev, containingPlaylist.id]);
      }
    }
  }, [currentVideo, playlists, expandedPlaylists]);

  // Video control handlers
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && videoRef.current) {
      videoRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // AI Video Search
  const handleAiSearch = useCallback(async () => {
    if (!aiSearchQuery.trim()) return;
    
    if (videoState.aiSearchCount >= 2) {
      toast({
        title: "Search Limit Reached",
        description: "You can only perform 2 AI searches per module.",
        variant: "destructive",
      });
      return;
    }

    setAiSearchLoading(true);
    try {
      const newState = await searchAIVideos(courseId, moduleId, aiSearchQuery);
      setVideoState(newState);
      
      // Update playlists
      setPlaylists(prev => {
        const updated = prev.filter(p => p.type !== 'ai-search');
        if (newState.aiVideos.length > 0) {
          updated.push({
            id: 'ai-search-results',
            title: 'AI Search Results',
            type: 'ai-search',
            videos: newState.aiVideos
          });
        }
        return updated;
      });

      // Auto-expand search results
      setExpandedPlaylists(prev => 
        prev.includes('ai-search-results') ? prev : [...prev, 'ai-search-results']
      );

      toast({
        title: "Search Complete",
        description: `Found ${newState.aiVideos.length} videos for "${aiSearchQuery}"`,
      });

      setAiSearchQuery('');
    } catch (error) {
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Unable to search for videos",
        variant: "destructive",
      });
    } finally {
      setAiSearchLoading(false);
    }
  }, [aiSearchQuery, videoState.aiSearchCount, courseId, moduleId, toast]);

  // Custom URL handling
  const handleAddCustomUrl = useCallback(async () => {
    if (!customUrl.trim()) return;

    if (!validateYouTubeUrl(customUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setCustomUrlLoading(true);
    try {
      const embedUrl = convertToEmbedUrl(customUrl);
      const newState = await addCustomVideo(courseId, moduleId, {
        url: customUrl,
        title: 'Custom Video',
        language: 'English',
        creator: 'User Added',
        notes: 'Added via custom URL'
      });
      
      setVideoState(newState);
      
      // Update playlists
      setPlaylists(prev => {
        const updated = prev.filter(p => p.type !== 'custom');
        if (newState.customVideos.length > 0) {
          updated.push({
            id: 'custom-videos',
            title: 'Custom Videos',
            type: 'custom',
            videos: newState.customVideos
          });
        }
        return updated;
      });

      // Auto-expand custom videos
      setExpandedPlaylists(prev => 
        prev.includes('custom-videos') ? prev : [...prev, 'custom-videos']
      );

      setCustomUrl('');
      toast({
        title: "Video Added",
        description: "Custom video has been added to your playlist",
      });

    } catch (error) {
      toast({
        title: "Failed to Add Video",
        description: error instanceof Error ? error.message : "Unable to add the video",
        variant: "destructive",
      });
    } finally {
      setCustomUrlLoading(false);
    }
  }, [customUrl, courseId, moduleId, toast]);

  // Handle video removal
  const handleRemoveVideo = useCallback(async (videoId: string) => {
    try {
      const newState = await removeVideo(courseId, moduleId, videoId);
      setVideoState(newState);
      
      // Update playlists
      setPlaylists(prev => prev.map(playlist => ({
        ...playlist,
        videos: playlist.videos.filter(v => v.id !== videoId)
      })).filter(playlist => playlist.videos.length > 0));
      
      // If removed video was current, select another
      if (currentVideo?.id === videoId) {
        const allVideos = playlists.flatMap(p => p.videos).filter(v => v.id !== videoId);
        setCurrentVideo(allVideos.length > 0 ? allVideos[0] : null);
      }
      
      toast({
        title: "Video Removed",
        description: "Video has been removed from your playlist",
      });
    } catch (error) {
      toast({
        title: "Failed to Remove Video",
        description: error instanceof Error ? error.message : "Unable to remove video",
        variant: "destructive",
      });
    }
  }, [courseId, moduleId, currentVideo, playlists, toast]);

  // Handle video selection
  const handleVideoSelect = useCallback((video: VideoItem) => {
    setCurrentVideo(video);
    setIsPlaying(false);
    setCurrentTime(0);
    setLeftSidebarOpen(false); // Close mobile sidebar
  }, []);

  // Handle playlist toggle
  const handlePlaylistToggle = useCallback((playlistId: string) => {
    setExpandedPlaylists(prev => 
      prev.includes(playlistId) 
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    );
  }, []);

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-6 max-w-[1600px]">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading Module</h3>
              <p className="text-muted-foreground">Please wait while we load your content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLeftSidebarOpen(true)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Videos ({playlists.reduce((acc, p) => acc + p.videos.length, 0)})
          </Button>
          <h1 className="text-lg font-semibold truncate mx-4">{currentModule.title}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRightSidebarOpen(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Course
          </Button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Sidebar - Video List */}
          <div className={`
            lg:col-span-3 
            ${leftSidebarOpen ? 'fixed inset-0 z-50 bg-background' : 'hidden lg:block'}
          `}>
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Module Videos
                  </CardTitle>
                  {leftSidebarOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLeftSidebarOpen(false)}
                      className="lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* AI Search */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search AI videos..."
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                      className="flex-1"
                      disabled={videoState.aiSearchCount >= 2}
                    />
                    <Button
                      onClick={handleAiSearch}
                      disabled={aiSearchLoading || !aiSearchQuery.trim() || videoState.aiSearchCount >= 2}
                      size="sm"
                    >
                      {aiSearchLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {videoState.aiSearchCount >= 2 && (
                    <p className="text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      AI search limit reached (2/2)
                    </p>
                  )}

                  {/* Custom URL */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add YouTube URL..."
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomUrl()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddCustomUrl}
                      disabled={customUrlLoading || !customUrl.trim()}
                      size="sm"
                    >
                      {customUrlLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto">
                {playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No videos available</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add custom videos or search for AI-suggested content
                    </p>
                  </div>
                ) : (
                  <Accordion type="multiple" value={expandedPlaylists} className="space-y-2">
                    {playlists.map((playlist) => (
                      <AccordionItem key={playlist.id} value={playlist.id} className="border rounded-lg">
                        <AccordionTrigger
                          onClick={() => handlePlaylistToggle(playlist.id)}
                          className="px-4 py-3 hover:no-underline"
                        >
                          <div className="flex items-center gap-2 w-full">
                            {playlist.type === 'module' && <BookOpen className="h-4 w-4 text-blue-500" />}
                            {playlist.type === 'ai-search' && <Brain className="h-4 w-4 text-purple-500" />}
                            {playlist.type === 'custom' && <ExternalLink className="h-4 w-4 text-green-500" />}
                            <span className="font-medium flex-1 text-left">{playlist.title}</span>
                            <Badge variant="secondary">
                              {playlist.videos.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-2">
                            {playlist.videos.map((video) => (
                              <div
                                key={video.id}
                                className={`
                                  group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                                  ${currentVideo?.id === video.id 
                                    ? 'bg-primary/10 border border-primary/30' 
                                    : 'hover:bg-muted/50 border border-transparent'
                                  }
                                `}
                              >
                                <div 
                                  className="flex-1 flex items-center gap-3"
                                  onClick={() => handleVideoSelect(video)}
                                >
                                  <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                                    {video.thumbnail ? (
                                      <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Video className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                      <PlayCircle className="h-6 w-6 text-white drop-shadow-lg" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                      {video.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {video.duration && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {video.duration}
                                        </span>
                                      )}
                                      {video.language && (
                                        <span className="flex items-center gap-1">
                                          <Globe className="h-3 w-3" />
                                          {video.language}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Remove button for custom and AI videos */}
                                {(video.source === 'custom' || video.source === 'ai') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveVideo(video.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Video Player */}
          <div className="lg:col-span-6">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl line-clamp-1">{currentModule.title}</CardTitle>
                    {currentVideo && (
                      <p className="text-muted-foreground text-sm line-clamp-1 mt-1">
                        {currentVideo.title}
                      </p>
                    )}
                  </div>
                  {currentModule.estimatedTime && (
                    <Badge variant="outline" className="ml-4">
                      <Clock className="h-3 w-3 mr-1" />
                      {currentModule.estimatedTime}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {currentVideo ? (
                  <div className="flex-1 flex flex-col">
                    {/* Video Container */}
                    <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
                      {currentVideo.url.includes('youtube.com') || currentVideo.url.includes('youtu.be') || currentVideo.youtubeEmbedUrl ? (
                        <iframe
                          src={currentVideo.youtubeEmbedUrl || currentVideo.url}
                          title={currentVideo.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          src={currentVideo.url}
                          className="w-full h-full"
                          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      )}
                    </div>

                    {/* Video Controls (for non-YouTube videos) */}
                    {!currentVideo.url.includes('youtube.com') && !currentVideo.url.includes('youtu.be') && !currentVideo.youtubeEmbedUrl && (
                      <div className="mt-4 space-y-3">
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground min-w-[45px]">{formatTime(currentTime)}</span>
                          <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-muted-foreground min-w-[45px]">{formatTime(duration)}</span>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button onClick={togglePlay} size="sm">
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>

                            <div className="flex items-center gap-2">
                              <Button onClick={toggleMute} variant="outline" size="sm">
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              </Button>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>

                          <Button onClick={toggleFullscreen} variant="outline" size="sm">
                            <Maximize className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center">
                      <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No video selected</h3>
                      <p className="text-muted-foreground">
                        Choose a video from the sidebar to start learning
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Course Navigation */}
          <div className={`
            lg:col-span-3 
            ${rightSidebarOpen ? 'fixed inset-0 z-50 bg-background' : 'hidden lg:block'}
          `}>
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Course Navigation
                  </CardTitle>
                  {rightSidebarOpen && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRightSidebarOpen(false)}
                      className="lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{mockCourse.title}</p>
                {mockCourse.description && (
                  <p className="text-xs text-muted-foreground">{mockCourse.description}</p>
                )}
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {mockCourse.modules.map((module, index) => (
                    <Link
                      key={module.id}
                      href={`/module?courseId=${courseId}&moduleId=${module.id}`}
                      className={`
                        block p-4 rounded-lg border transition-colors
                        ${module.id === moduleId
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'hover:bg-muted/50 border-border'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
                          ${module.isCompleted
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                            : module.id === moduleId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          {module.isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {module.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {module.estimatedTime && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {module.estimatedTime}
                              </Badge>
                            )}
                            {module.isCompleted && (
                              <Badge variant="secondary" className="text-xs">
                                Completed
                              </Badge>
                            )}
                            {module.id === moduleId && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Overlay */}
        {(leftSidebarOpen || rightSidebarOpen) && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => {
              setLeftSidebarOpen(false);
              setRightSidebarOpen(false);
            }}
          />        )}
      </div>
    </div>
  );
}

// Export a wrapper component with Suspense
export default function ModulePage() {
  return (
    <Suspense fallback={
      <div className="container py-6 max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    }>
      <ModuleContent />
    </Suspense>
  );
}
