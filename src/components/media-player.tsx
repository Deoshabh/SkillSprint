"use client";
import type { Module, VideoLink, PlaylistItemDetail } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, Video, Search, Loader2, Info, ChevronDown, ListVideo, Trash2, ListChecks, ChevronLeft, ChevronRight, HelpCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { fetchYoutubePlaylistItems } from '@/ai/flows/fetch-youtube-playlist-items-flow';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import ReactMarkdown from 'react-markdown';


interface MediaPlayerProps {
  module: Module;
  aiFetchedVideos?: VideoLink[];
  userAddedModuleVideos?: VideoLink[]; 
  onSearchWithAI?: () => void;
  isAISearching?: boolean;
  userPreferredLanguage?: string;
  onRemoveUserVideo?: (videoId: string) => void; 
  courseId?: string;
  courseName?: string;
}

const PLAYLIST_ITEMS_PER_PAGE = 10;

export function MediaPlayer({ 
  module, 
  aiFetchedVideos = [], 
  userAddedModuleVideos = [], 
  onSearchWithAI, 
  isAISearching = false,
  userPreferredLanguage,
  onRemoveUserVideo,
  courseId,
  courseName
}: MediaPlayerProps) {
  const { toast } = useToast();
  const { markVideoWatched } = useProgressTracker();
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [selectedVideoKey, setSelectedVideoKey] = useState<string>('');
  const [currentVideoIsPlaylist, setCurrentVideoIsPlaylist] = useState<boolean>(false);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
  const [currentVideoIsUserAdded, setCurrentVideoIsUserAdded] = useState<boolean>(false);
  const [currentVideoIdForRemoval, setCurrentVideoIdForRemoval] = useState<string | undefined>(undefined);

  const [fetchedPlaylistItems, setFetchedPlaylistItems] = useState<PlaylistItemDetail[] | null>(null);
  const [isLoadingPlaylistItems, setIsLoadingPlaylistItems] = useState<boolean>(false);
  const [playlistItemsError, setPlaylistItemsError] = useState<string | null>(null);
  const [activeVideoIdFromPlaylist, setActiveVideoIdFromPlaylist] = useState<string | null>(null);
  const [playlistCurrentPage, setPlaylistCurrentPage] = useState<number>(1);

  // Video tracking for xAPI
  const [videoStartTime, setVideoStartTime] = useState<number | null>(null);
  const [hasTrackedVideoStart, setHasTrackedVideoStart] = useState<boolean>(false);

  const trackVideoStart = useCallback(async (videoId: string, videoTitle: string) => {
    if (!hasTrackedVideoStart) {
      setVideoStartTime(Date.now());
      setHasTrackedVideoStart(true);
      
      // Track video started
      await markVideoWatched(
        videoId,
        videoTitle,
        undefined, // duration unknown at start
        module.id,
        module.title
      );
    }
  }, [hasTrackedVideoStart, markVideoWatched, module.id, module.title]);

  const trackVideoCompletion = useCallback(async (videoId: string, videoTitle: string, watchedDuration?: number) => {
    if (videoStartTime) {
      const actualWatchTime = watchedDuration || (Date.now() - videoStartTime) / 1000;
      
      // Track video completion
      await markVideoWatched(
        videoId,
        videoTitle,
        actualWatchTime,
        module.id,
        module.title
      );
    }
  }, [videoStartTime, markVideoWatched, module.id, module.title]);

  // Reset tracking when video changes
  useEffect(() => {
    setHasTrackedVideoStart(false);
    setVideoStartTime(null);
  }, [currentVideoUrl]);


  const allAvailableVideos = useMemo(() => {
    let videos: VideoLink[] = [];
    if (module.contentType === 'video') {      if (module.contentUrl && module.contentUrl.includes('youtube.com/embed/')) {
        videos.push({
          id: `module-default-${module.id}`,
          langCode: 'module', 
          langName: 'Module Default',
          youtubeEmbedUrl: module.contentUrl,
          title: `${module.title} (Module Default)`,
          isPlaylist: module.contentUrl.includes('videoseries?list='),
        });
      }
      if (module.videoLinks) {
        videos = videos.concat(module.videoLinks.map(v => ({...v, id: v.id || `module-link-${Math.random().toString(36).substring(2,9)}`, title: v.title || "Module Video"})));
      }
      if (aiFetchedVideos) {
        videos = videos.concat(aiFetchedVideos.map(v => ({...v, id: v.id || `ai-${Math.random().toString(36).substring(2,9)}`, title: v.title || "AI Suggested Video"})));
      }
      if (userAddedModuleVideos) { 
        videos = videos.concat(userAddedModuleVideos.map(v => ({...v, id: v.id || `user-module-${Math.random().toString(36).substring(2,9)}`, title: v.title || "My Added Video" })));
      }
      
      const uniqueVideosMap = new Map<string, VideoLink>();
      videos.forEach(video => {
        if (!uniqueVideosMap.has(video.youtubeEmbedUrl)) {
          const inferredIsPlaylist = video.isPlaylist !== undefined ? video.isPlaylist : video.youtubeEmbedUrl.includes('videoseries?list=');
          uniqueVideosMap.set(video.youtubeEmbedUrl, {...video, isPlaylist: inferredIsPlaylist});
        }
      });
      return Array.from(uniqueVideosMap.values());
    }
    return [];
  }, [module, aiFetchedVideos, userAddedModuleVideos]); 

  const updateCurrentVideoDetails = useCallback((videoLink: VideoLink | undefined) => {
    if (videoLink) {
      const isNewPlaylist = videoLink.isPlaylist && currentVideoUrl !== videoLink.youtubeEmbedUrl;
      setCurrentVideoUrl(videoLink.youtubeEmbedUrl);
      setSelectedVideoKey(videoLink.youtubeEmbedUrl);
      setCurrentVideoIsPlaylist(!!videoLink.isPlaylist);
      setCurrentVideoTitle(videoLink.title);
      const isUserAdded = userAddedModuleVideos.some(uv => uv.youtubeEmbedUrl === videoLink.youtubeEmbedUrl);
      setCurrentVideoIsUserAdded(isUserAdded);
      setCurrentVideoIdForRemoval(isUserAdded ? videoLink.id : undefined);
      
      if (!videoLink.isPlaylist || isNewPlaylist) {
        setFetchedPlaylistItems(null);
        setPlaylistItemsError(null);
        setActiveVideoIdFromPlaylist(null);
        setPlaylistCurrentPage(1); 
      }
    } else {
      setCurrentVideoUrl(null);
      setSelectedVideoKey('');
      setCurrentVideoIsPlaylist(false);
      setCurrentVideoTitle('');
      setCurrentVideoIsUserAdded(false);
      setCurrentVideoIdForRemoval(undefined);
      setFetchedPlaylistItems(null);
      setPlaylistItemsError(null);
      setActiveVideoIdFromPlaylist(null);
      setPlaylistCurrentPage(1);
    }
  }, [userAddedModuleVideos, currentVideoUrl]);


  useEffect(() => {
    if (module.contentType === 'video' && allAvailableVideos.length > 0) {
      const currentSelectedVideo = allAvailableVideos.find(v => v.youtubeEmbedUrl === selectedVideoKey);
      
      if (currentSelectedVideo) {
        if (currentVideoUrl !== currentSelectedVideo.youtubeEmbedUrl || currentVideoIsPlaylist !== !!currentSelectedVideo.isPlaylist) {
             updateCurrentVideoDetails(currentSelectedVideo);
        }
      } else {
        let videoToSelect: VideoLink | undefined = undefined;
        if (userAddedModuleVideos.length > 0) {
            const firstUserAdded = userAddedModuleVideos[0];
            if(allAvailableVideos.find(v => v.youtubeEmbedUrl === firstUserAdded.youtubeEmbedUrl)) {
                videoToSelect = firstUserAdded;
            }
        }
        if (!videoToSelect && userPreferredLanguage) {
          videoToSelect = allAvailableVideos.find(v => 
            v.langName.toLowerCase().includes(userPreferredLanguage.toLowerCase()) || 
            v.langCode.toLowerCase() === userPreferredLanguage.substring(0,2).toLowerCase()
          );
        }
        if (!videoToSelect) {
          videoToSelect = allAvailableVideos.find(v => v.langCode === 'en' || v.langName.toLowerCase().includes('english'));
        }
        if (!videoToSelect && module.contentUrl && module.contentUrl.includes('youtube.com/embed/')) { 
            videoToSelect = allAvailableVideos.find(v => v.id === `module-default-${module.id}`);
        }
        if (!videoToSelect) { 
          videoToSelect = allAvailableVideos[0];
        }
        updateCurrentVideoDetails(videoToSelect);
      }
    } else if (module.contentType !== 'video') { // Reset video state if not a video module
      updateCurrentVideoDetails(undefined);
    }
  }, [allAvailableVideos, module.contentType, module.id, module.contentUrl, module.title, selectedVideoKey, userPreferredLanguage, userAddedModuleVideos, updateCurrentVideoDetails, currentVideoUrl, currentVideoIsPlaylist]);


  useEffect(() => {
    if (currentVideoIsPlaylist && currentVideoUrl) {
      const playlistIdMatch = currentVideoUrl.match(/list=([^&]+)/);
      if (playlistIdMatch && playlistIdMatch[1]) {
        const playlistId = playlistIdMatch[1];
        setIsLoadingPlaylistItems(true);
        setPlaylistItemsError(null);
        setFetchedPlaylistItems(null); 
        setActiveVideoIdFromPlaylist(null);
        setPlaylistCurrentPage(1); 

        fetchYoutubePlaylistItems({ playlistId })
          .then(response => {
            if (response.error) {
              setPlaylistItemsError(response.error);
              toast({ title: "Playlist Error", description: response.error, variant: "destructive"});
            } else if (response.items && response.items.length > 0) {
              setFetchedPlaylistItems(response.items);
            } else {
              setFetchedPlaylistItems([]);
              toast({ title: "Playlist Empty", description: "No videos found in this playlist."});
            }
          })
          .catch(err => {
            console.error("Error calling fetchYoutubePlaylistItemsFlow:", err);
            const message = err instanceof Error ? err.message : "Failed to fetch playlist items.";
            setPlaylistItemsError(message);
            toast({ title: "Fetch Error", description: message, variant: "destructive"});
          })
          .finally(() => {
            setIsLoadingPlaylistItems(false);
          });
      }
    } else {
        setFetchedPlaylistItems(null);
        setIsLoadingPlaylistItems(false);
        setPlaylistItemsError(null);
        setActiveVideoIdFromPlaylist(null);
        setPlaylistCurrentPage(1);
    }
  }, [currentVideoUrl, currentVideoIsPlaylist, toast]);


  const handleVideoSelectionChange = (newSelectedKey: string) => {
    const selected = allAvailableVideos.find(v => v.youtubeEmbedUrl === newSelectedKey);
    setSelectedVideoKey(newSelectedKey); 
    setActiveVideoIdFromPlaylist(null); 
    if (selected) {
        updateCurrentVideoDetails(selected);
    }
  };

  const handleRemoveCurrentVideo = () => {
    if (currentVideoIsUserAdded && currentVideoIdForRemoval && onRemoveUserVideo) {
      onRemoveUserVideo(currentVideoIdForRemoval);
      setSelectedVideoKey(''); 
    }
  };

  const handlePlaylistItemClick = (videoId: string) => {
    setActiveVideoIdFromPlaylist(videoId);
  };
  
  const iframeSrc = activeVideoIdFromPlaylist 
    ? `https://www.youtube.com/embed/${activeVideoIdFromPlaylist}` 
    : currentVideoUrl;

  const currentPlaylistItemsPage = useMemo(() => {
    if (!fetchedPlaylistItems) return [];
    const startIndex = (playlistCurrentPage - 1) * PLAYLIST_ITEMS_PER_PAGE;
    return fetchedPlaylistItems.slice(startIndex, startIndex + PLAYLIST_ITEMS_PER_PAGE);
  }, [fetchedPlaylistItems, playlistCurrentPage]);

  const totalPlaylistPages = useMemo(() => {
    if (!fetchedPlaylistItems) return 1;
    return Math.ceil(fetchedPlaylistItems.length / PLAYLIST_ITEMS_PER_PAGE);
  }, [fetchedPlaylistItems]);

  const renderContent = () => {
    switch (module.contentType) {
      case 'video':
        if (isAISearching && allAvailableVideos.length === 0) { 
            return (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg aspect-video">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" aria-label="Loading videos" />
                <p className="text-muted-foreground">AI is searching for videos...</p>
              </div>
            );
        }
        if (allAvailableVideos.length === 0 ) {
          return (
            <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center aspect-video">
              <Video className="h-16 w-16 text-muted-foreground mb-2" aria-hidden="true" />
              <p className="text-muted-foreground mb-4">No video available for this module yet.</p>
              {onSearchWithAI && (
                <Button onClick={onSearchWithAI} disabled={isAISearching} aria-label="Search for videos with AI">
                  <Search className="h-4 w-4 mr-2" aria-hidden="true" /> 
                  {isAISearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : null}
                  {isAISearching ? 'Searching...' : 'Search with AI'}
                </Button>
              )}
            </div>
          );
        }
        
        return (
          <div className="space-y-4">            {iframeSrc ? (
                <div className="aspect-video w-full">
                    <iframe
                    src={iframeSrc}
                    title={activeVideoIdFromPlaylist ? fetchedPlaylistItems?.find(item => item.videoId === activeVideoIdFromPlaylist)?.title : currentVideoTitle || module.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg shadow-md"
                    onLoad={() => {
                      const videoId = activeVideoIdFromPlaylist || currentVideoUrl || 'unknown';
                      const videoTitle = activeVideoIdFromPlaylist 
                        ? fetchedPlaylistItems?.find(item => item.videoId === activeVideoIdFromPlaylist)?.title || 'Unknown Video'
                        : currentVideoTitle || module.title;
                      trackVideoStart(videoId, videoTitle);
                    }}
                    ></iframe>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center aspect-video">
                    <Video className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
                    <p className="text-muted-foreground">Video could not be loaded or none selected.</p>
                 </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                {allAvailableVideos.length > 0 && (
                <div className="w-full sm:flex-grow">
                    <Select value={selectedVideoKey} onValueChange={handleVideoSelectionChange} disabled={allAvailableVideos.length === 0}>
                    <SelectTrigger className="truncate" aria-label="Select video version">
                        <SelectValue placeholder="Select a video version" />
                    </SelectTrigger>                    <SelectContent>
                        {allAvailableVideos.map((video) => (
                        <SelectItem key={video.id || video.youtubeEmbedUrl} value={video.youtubeEmbedUrl} className="text-sm">
                            <span className="truncate" title={video.title}>
                                {userAddedModuleVideos.some(uv => uv.youtubeEmbedUrl === video.youtubeEmbedUrl) && '👤 '}
                                {video.title || 'Untitled Video'} ({video.langName}) {video.isPlaylist ? " (Playlist)" : ""}
                                {video.creator && <span className="text-xs text-muted-foreground ml-1">- by {video.creator}</span>}
                            </span>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                )}
                {onSearchWithAI && (
                    <Button onClick={onSearchWithAI} variant="outline" className="w-full sm:w-auto flex-shrink-0" disabled={isAISearching} aria-label="Find more videos with AI">
                        {isAISearching && !currentVideoUrl ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4 mr-2" aria-hidden="true" />}
                        {isAISearching && !currentVideoUrl ? 'Searching...' : 'Find More Videos'}
                    </Button>
                )}
                 {currentVideoIsUserAdded && onRemoveUserVideo && currentVideoIdForRemoval && (
                    <Button onClick={handleRemoveCurrentVideo} variant="destructive" size="icon" className="flex-shrink-0" title="Remove this video from module" aria-label="Remove this video from module">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                )}
            </div>
             {currentVideoIsPlaylist && (
              <Accordion type="single" collapsible className="w-full" defaultValue="playlist-items">
                <AccordionItem value="playlist-items" className="border border-primary/30 rounded-md">
                   <AccordionTrigger className={cn(
                       "text-sm py-3 px-4 rounded-t-md hover:no-underline",
                       "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground/90 hover:bg-primary/20 dark:hover:bg-primary/30",
                       !isLoadingPlaylistItems && !playlistItemsError && fetchedPlaylistItems && fetchedPlaylistItems.length > 0 && "rounded-b-md"
                       )}>
                    <div className="flex items-center">
                      <ListChecks className="h-5 w-5 mr-2 flex-shrink-0" aria-hidden="true" />
                      <span className="font-medium">Playlist Content ({fetchedPlaylistItems?.length || 0} videos)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-3 text-xs text-muted-foreground rounded-b-md bg-background max-h-[450px] overflow-y-auto">
                    {isLoadingPlaylistItems && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" aria-label="Loading playlist items" /> Loading playlist videos...
                      </div>
                    )}
                    {playlistItemsError && (
                      <div className="flex items-center text-destructive p-4">
                        <AlertTriangle className="h-5 w-5 mr-2" aria-hidden="true" /> Error: {playlistItemsError}
                      </div>
                    )}
                    {!isLoadingPlaylistItems && !playlistItemsError && fetchedPlaylistItems && fetchedPlaylistItems.length === 0 && (
                      <p className="text-center p-4">No videos found in this playlist, or it might be private.</p>
                    )}
                    {!isLoadingPlaylistItems && !playlistItemsError && currentPlaylistItemsPage.length > 0 && (
                      <div className="space-y-2">
                        {currentPlaylistItemsPage.map((item, index) => (
                          <div 
                            key={item.videoId} 
                            onClick={() => handlePlaylistItemClick(item.videoId)}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                              activeVideoIdFromPlaylist === item.videoId && "bg-muted font-semibold ring-2 ring-primary"
                            )}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlaylistItemClick(item.videoId)}
                          >
                            <span className="text-xs w-6 text-center text-muted-foreground">{(playlistCurrentPage - 1) * PLAYLIST_ITEMS_PER_PAGE + index + 1}.</span>
                            <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0">
                                <Image 
                                    src={item.thumbnailUrl || "https://placehold.co/120x90.png?text=No+Thumb"} 
                                    alt={item.title || "Video thumbnail"} 
                                    fill
                                    style={{objectFit: 'cover'}}
                                    sizes="(max-width: 768px) 80px, 80px"
                                    data-ai-hint="video thumbnail"
                                />
                            </div>
                            <p className="text-xs flex-grow line-clamp-2" title={item.title}>{item.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isLoadingPlaylistItems && !playlistItemsError && fetchedPlaylistItems && fetchedPlaylistItems.length > PLAYLIST_ITEMS_PER_PAGE && (
                        <div className="flex justify-between items-center mt-4 pt-3 border-t">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPlaylistCurrentPage(p => Math.max(1, p - 1))}
                                disabled={playlistCurrentPage === 1}
                                aria-label="Previous page of playlist items"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Previous
                            </Button>
                            <span className="text-xs text-muted-foreground" aria-live="polite">
                                Page {playlistCurrentPage} of {totalPlaylistPages}
                            </span>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setPlaylistCurrentPage(p => Math.min(totalPlaylistPages, p + 1))}
                                disabled={playlistCurrentPage === totalPlaylistPages}
                                aria-label="Next page of playlist items"
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                            </Button>
                        </div>
                    )}
                     <p className="mt-3 text-center text-muted-foreground text-xs italic">
                        Use the YouTube player controls for full playlist navigation (next, previous, shuffle). Clicking an item above plays it directly.
                     </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        );
      case 'markdown':
      case 'text': // Handle 'text' as markdown as well
        return (
          <Card className="prose dark:prose-invert max-w-none p-6 bg-background shadow-inner min-h-[300px] max-h-[60vh] overflow-y-auto">
            <ReactMarkdown>{module.contentData || 'No text content available for this module.'}</ReactMarkdown>
          </Card>
        );
      case 'pdf':
        return (
           <div className="flex flex-col items-center justify-center h-[60vh] min-h-[400px] bg-muted rounded-lg p-1 text-center">            {module.contentUrl ? (
                <iframe 
                    src={module.contentUrl} 
                    className="w-full h-full border-none rounded-md" 
                    title={`PDF viewer for ${module.title}`} 
                    aria-label={`PDF content for module: ${module.title}`}
                    onLoad={() => {
                      trackVideoStart(module.id, module.title);
                    }}
                />
            ) : (
              <>
                <FileText className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
                <p className="text-muted-foreground text-center mb-2">No PDF document linked for this module.</p>
                <p className="text-sm text-muted-foreground">Please check the module content or contact support.</p>
              </>
            )}
          </div>
        );
      case 'quiz':
         return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center">
            <HelpCircleIcon className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
            <p className="text-lg font-semibold text-foreground">Quiz: {module.title}</p>
            <p className="text-sm text-muted-foreground mt-2">
              The interactive quiz for this module will be available here soon.
            </p>
          </div>
        );
      case 'assignment':
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
            <p className="text-lg font-semibold text-foreground">Assignment: {module.title}</p>
            <p className="text-sm text-muted-foreground mt-2">Details for this assignment will appear here.</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <AlertTriangle className="h-16 w-16 text-destructive mb-2" aria-hidden="true" />
            <p className="text-destructive-foreground">Unsupported content type.</p>
          </div>
        );
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{module.title}</CardTitle>
        {module.description && <CardDescription>{module.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
