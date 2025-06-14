
"use client";
import type { Module, VideoLink, PlaylistItemDetail } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, Video, Search, Loader2, Info, ChevronDown, ListVideo, Trash2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { fetchYoutubePlaylistItems } from '@/ai/flows/fetch-youtube-playlist-items-flow';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface MediaPlayerProps {
  module: Module;
  aiFetchedVideos?: VideoLink[];
  userAddedModuleVideos?: VideoLink[]; 
  onSearchWithAI?: () => void;
  isAISearching?: boolean;
  userPreferredLanguage?: string;
  onRemoveUserVideo?: (videoId: string) => void; 
}

export function MediaPlayer({ 
  module, 
  aiFetchedVideos = [], 
  userAddedModuleVideos = [], 
  onSearchWithAI, 
  isAISearching = false,
  userPreferredLanguage,
  onRemoveUserVideo
}: MediaPlayerProps) {
  const { toast } = useToast();
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [selectedVideoKey, setSelectedVideoKey] = useState<string>(''); // Stores the youtubeEmbedUrl of the selected VideoLink
  const [currentVideoIsPlaylist, setCurrentVideoIsPlaylist] = useState<boolean>(false);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
  const [currentVideoIsUserAdded, setCurrentVideoIsUserAdded] = useState<boolean>(false);
  const [currentVideoIdForRemoval, setCurrentVideoIdForRemoval] = useState<string | undefined>(undefined); // ID of the VideoLink object

  // State for fetched playlist items
  const [fetchedPlaylistItems, setFetchedPlaylistItems] = useState<PlaylistItemDetail[] | null>(null);
  const [isLoadingPlaylistItems, setIsLoadingPlaylistItems] = useState<boolean>(false);
  const [playlistItemsError, setPlaylistItemsError] = useState<string | null>(null);
  const [activeVideoIdFromPlaylist, setActiveVideoIdFromPlaylist] = useState<string | null>(null);


  const allAvailableVideos = useMemo(() => {
    let videos: VideoLink[] = [];
    if (module.contentType === 'video') {
      if (module.contentUrl && module.contentUrl.includes('youtube.com/embed/')) {
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
      setCurrentVideoUrl(videoLink.youtubeEmbedUrl);
      setSelectedVideoKey(videoLink.youtubeEmbedUrl);
      setCurrentVideoIsPlaylist(!!videoLink.isPlaylist);
      setCurrentVideoTitle(videoLink.title);
      const isUserAdded = userAddedModuleVideos.some(uv => uv.youtubeEmbedUrl === videoLink.youtubeEmbedUrl);
      setCurrentVideoIsUserAdded(isUserAdded);
      setCurrentVideoIdForRemoval(isUserAdded ? videoLink.id : undefined);
      
      // Reset playlist specific states if not a playlist or if it's a new playlist
      if (!videoLink.isPlaylist || (videoLink.isPlaylist && currentVideoUrl !== videoLink.youtubeEmbedUrl)) {
        setFetchedPlaylistItems(null);
        setPlaylistItemsError(null);
        setActiveVideoIdFromPlaylist(null);
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
    }
  }, [userAddedModuleVideos, currentVideoUrl]);


  useEffect(() => {
    if (module.contentType === 'video' && allAvailableVideos.length > 0) {
      const currentSelectedVideo = allAvailableVideos.find(v => v.youtubeEmbedUrl === selectedVideoKey);
      
      if (currentSelectedVideo) {
        updateCurrentVideoDetails(currentSelectedVideo);
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
    } else {
      updateCurrentVideoDetails(undefined);
    }
  }, [allAvailableVideos, module.contentType, module.id, module.contentUrl, module.title, selectedVideoKey, userPreferredLanguage, userAddedModuleVideos, updateCurrentVideoDetails]);


  // Effect to fetch playlist items when a playlist is selected
  useEffect(() => {
    if (currentVideoIsPlaylist && currentVideoUrl) {
      const playlistIdMatch = currentVideoUrl.match(/list=([^&]+)/);
      if (playlistIdMatch && playlistIdMatch[1]) {
        const playlistId = playlistIdMatch[1];
        setIsLoadingPlaylistItems(true);
        setPlaylistItemsError(null);
        setFetchedPlaylistItems(null); 
        setActiveVideoIdFromPlaylist(null);

        fetchYoutubePlaylistItems({ playlistId })
          .then(response => {
            if (response.error) {
              setPlaylistItemsError(response.error);
              toast({ title: "Playlist Error", description: response.error, variant: "destructive"});
            } else if (response.items && response.items.length > 0) {
              setFetchedPlaylistItems(response.items);
            } else {
              setFetchedPlaylistItems([]); // No items found
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
        // Not a playlist, or no URL, clear playlist items
        setFetchedPlaylistItems(null);
        setIsLoadingPlaylistItems(false);
        setPlaylistItemsError(null);
        setActiveVideoIdFromPlaylist(null);
    }
  }, [currentVideoUrl, currentVideoIsPlaylist, toast]);


  const handleVideoSelectionChange = (newSelectedKey: string) => {
    const selected = allAvailableVideos.find(v => v.youtubeEmbedUrl === newSelectedKey);
    setSelectedVideoKey(newSelectedKey); // This will trigger the main useEffect to update details
    setActiveVideoIdFromPlaylist(null); // Reset individual video selection when main source changes
    if (selected) {
        updateCurrentVideoDetails(selected);
    }
  };

  const handleRemoveCurrentVideo = () => {
    if (currentVideoIsUserAdded && currentVideoIdForRemoval && onRemoveUserVideo) {
      onRemoveUserVideo(currentVideoIdForRemoval);
      // After removal, the main useEffect will re-evaluate and pick a new video
      setSelectedVideoKey(''); // Force re-evaluation by clearing the selected key
    }
  };

  const handlePlaylistItemClick = (videoId: string) => {
    setActiveVideoIdFromPlaylist(videoId);
  };
  
  const iframeSrc = activeVideoIdFromPlaylist 
    ? `https://www.youtube.com/embed/${activeVideoIdFromPlaylist}` 
    : currentVideoUrl;

  const renderContent = () => {
    switch (module.contentType) {
      case 'video':
        if (isAISearching && allAvailableVideos.length === 0) { 
            return (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg aspect-video">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">AI is searching for videos...</p>
              </div>
            );
        }
        if (allAvailableVideos.length === 0 ) {
          return (
            <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center aspect-video">
              <Video className="h-16 w-16 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-4">No video available for this module yet.</p>
              {onSearchWithAI && (
                <Button onClick={onSearchWithAI} disabled={isAISearching}>
                  <Search className="h-4 w-4 mr-2" /> 
                  {isAISearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Search with AI'}
                </Button>
              )}
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            {iframeSrc ? (
                <div className="aspect-video w-full">
                    <iframe
                    src={iframeSrc}
                    title={activeVideoIdFromPlaylist ? fetchedPlaylistItems?.find(item => item.videoId === activeVideoIdFromPlaylist)?.title : currentVideoTitle || module.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg shadow-md"
                    ></iframe>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center aspect-video">
                    <Video className="h-16 w-16 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Video could not be loaded or none selected.</p>
                 </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                {allAvailableVideos.length > 0 && (
                <div className="w-full sm:flex-grow">
                    <Select value={selectedVideoKey} onValueChange={handleVideoSelectionChange} disabled={allAvailableVideos.length === 0}>
                    <SelectTrigger className="truncate">
                        <SelectValue placeholder="Select a video version" />
                    </SelectTrigger>
                    <SelectContent>
                        {allAvailableVideos.map((video) => (
                        <SelectItem key={video.youtubeEmbedUrl} value={video.youtubeEmbedUrl} className="text-sm">
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
                    <Button onClick={onSearchWithAI} variant="outline" className="w-full sm:w-auto flex-shrink-0" disabled={isAISearching}>
                        {isAISearching && !currentVideoUrl ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        {isAISearching && !currentVideoUrl ? 'Searching...' : 'Find More Videos'}
                    </Button>
                )}
                 {currentVideoIsUserAdded && onRemoveUserVideo && currentVideoIdForRemoval && (
                    <Button onClick={handleRemoveCurrentVideo} variant="destructive" size="icon" className="flex-shrink-0" title="Remove this video from module">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
             {currentVideoIsPlaylist && (
              <Accordion type="single" collapsible className="w-full" defaultValue="playlist-items">
                <AccordionItem value="playlist-items">
                   <AccordionTrigger className="text-sm py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground/90 rounded-md px-3 border border-primary/30 hover:no-underline hover:bg-primary/20">
                    <div className="flex items-center">
                      <ListChecks className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span className="font-medium">Playlist Content ({fetchedPlaylistItems?.length || 0} videos)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-3 text-xs text-muted-foreground border border-t-0 rounded-b-md bg-background max-h-96 overflow-y-auto">
                    {isLoadingPlaylistItems && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading playlist videos...
                      </div>
                    )}
                    {playlistItemsError && (
                      <div className="flex items-center text-destructive p-4">
                        <AlertTriangle className="h-5 w-5 mr-2" /> Error: {playlistItemsError}
                      </div>
                    )}
                    {!isLoadingPlaylistItems && !playlistItemsError && fetchedPlaylistItems && fetchedPlaylistItems.length === 0 && (
                      <p className="text-center p-4">No videos found in this playlist, or it might be private.</p>
                    )}
                    {!isLoadingPlaylistItems && !playlistItemsError && fetchedPlaylistItems && fetchedPlaylistItems.length > 0 && (
                      <div className="space-y-2">
                        {fetchedPlaylistItems.map((item, index) => (
                          <div 
                            key={item.videoId} 
                            onClick={() => handlePlaylistItemClick(item.videoId)}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                              activeVideoIdFromPlaylist === item.videoId && "bg-muted font-semibold ring-2 ring-primary"
                            )}
                          >
                            <span className="text-xs w-6 text-center text-muted-foreground">{index + 1}.</span>
                            <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0">
                                <Image 
                                    src={item.thumbnailUrl || "https://placehold.co/120x90.png?text=No+Thumb"} 
                                    alt={item.title} 
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
        return (
          <Card className="prose dark:prose-invert max-w-none p-6 bg-background shadow-inner">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {module.contentData || 'No markdown content available.'}
            </pre>
          </Card>
        );
      case 'pdf':
        return (
           <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg p-4">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">PDF Viewer</p>
            {module.contentUrl ? (
                <iframe src={module.contentUrl} className="w-full h-full border-none rounded-md" title={`PDF viewer for ${module.title}`} />
            ) : (
                <p className="text-sm text-muted-foreground text-center">No PDF available for this module.</p>
            )}
          </div>
        );
      case 'quiz':
         return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Quiz content placeholder.</p>
            <p className="text-sm text-muted-foreground">Quiz: {module.title}</p>
          </div>
        );
      case 'assignment':
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Assignment placeholder.</p>
            <p className="text-sm text-muted-foreground">Assignment: {module.title}</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <AlertTriangle className="h-16 w-16 text-destructive mb-2" />
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

