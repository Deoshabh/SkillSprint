
"use client";
import type { Module, VideoLink } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, Video, Search, Loader2, Info, ChevronDown, ListVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


interface MediaPlayerProps {
  module: Module;
  aiFetchedVideos?: VideoLink[];
  userSessionVideos?: VideoLink[]; 
  onSearchWithAI?: () => void;
  isAISearching?: boolean;
  userPreferredLanguage?: string;
}

export function MediaPlayer({ 
  module, 
  aiFetchedVideos = [], 
  userSessionVideos = [], 
  onSearchWithAI, 
  isAISearching = false,
  userPreferredLanguage 
}: MediaPlayerProps) {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [selectedVideoKey, setSelectedVideoKey] = useState<string>('');
  const [currentVideoIsPlaylist, setCurrentVideoIsPlaylist] = useState<boolean>(false);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');


  const allAvailableVideos = useMemo(() => {
    let videos: VideoLink[] = [];
    if (module.contentType === 'video') {
      if (module.contentUrl) {
        if (module.contentUrl.includes('youtube.com/embed/')) {
          videos.push({
            langCode: 'module', 
            langName: 'Module Default',
            youtubeEmbedUrl: module.contentUrl,
            title: `${module.title} (Module Default)`,
            isPlaylist: module.contentUrl.includes('videoseries?list='),
          });
        }
      }
      if (module.videoLinks) {
        videos = videos.concat(module.videoLinks.map(v => ({...v, title: v.title || "Module Video"})));
      }
      if (aiFetchedVideos) {
        videos = videos.concat(aiFetchedVideos.map(v => ({...v, title: v.title || "AI Suggested Video"})));
      }
      if (userSessionVideos) { 
        videos = videos.concat(userSessionVideos.map(v => ({...v, title: v.title || "User Added Video" })));
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
  }, [module, aiFetchedVideos, userSessionVideos]); 

  useEffect(() => {
    if (module.contentType === 'video' && allAvailableVideos.length > 0) {
      const currentSelectedVideo = allAvailableVideos.find(v => v.youtubeEmbedUrl === selectedVideoKey);
      
      if (currentSelectedVideo) {
        setCurrentVideoUrl(currentSelectedVideo.youtubeEmbedUrl);
        setCurrentVideoIsPlaylist(!!currentSelectedVideo.isPlaylist);
        setCurrentVideoTitle(currentSelectedVideo.title);
      } else {
        let videoToSelect: VideoLink | undefined = undefined;
        if (userPreferredLanguage) {
          videoToSelect = allAvailableVideos.find(v => 
            v.langName.toLowerCase().includes(userPreferredLanguage.toLowerCase()) || 
            v.langCode.toLowerCase() === userPreferredLanguage.substring(0,2).toLowerCase()
          );
        }
        if (!videoToSelect) {
          videoToSelect = allAvailableVideos.find(v => v.langCode === 'en' || v.langName.toLowerCase().includes('english'));
        }
        if (!videoToSelect && module.contentUrl && module.contentUrl.includes('youtube.com/embed/')) { 
            videoToSelect = allAvailableVideos.find(v => v.langCode === 'module');
        }
        if (!videoToSelect) { 
          videoToSelect = allAvailableVideos[0];
        }
        
        if (videoToSelect) {
          setCurrentVideoUrl(videoToSelect.youtubeEmbedUrl);
          setSelectedVideoKey(videoToSelect.youtubeEmbedUrl);
          setCurrentVideoIsPlaylist(!!videoToSelect.isPlaylist);
          setCurrentVideoTitle(videoToSelect.title);
        } else {
          setCurrentVideoUrl(null);
          setSelectedVideoKey('');
          setCurrentVideoIsPlaylist(false);
          setCurrentVideoTitle('');
        }
      }
    } else if (module.contentType !== 'video') {
        setCurrentVideoUrl(null); 
        setSelectedVideoKey('');
        setCurrentVideoIsPlaylist(false);
        setCurrentVideoTitle('');
    } else { 
        setCurrentVideoUrl(null);
        setSelectedVideoKey('');
        setCurrentVideoIsPlaylist(false);
        setCurrentVideoTitle('');
    }
  }, [allAvailableVideos, module.contentType, module.contentUrl, module.title, selectedVideoKey, userPreferredLanguage]);

  const handleVideoSelectionChange = (url: string) => {
    const selected = allAvailableVideos.find(v => v.youtubeEmbedUrl === url);
    if (selected) {
      setCurrentVideoUrl(selected.youtubeEmbedUrl);
      setSelectedVideoKey(selected.youtubeEmbedUrl);
      setCurrentVideoIsPlaylist(!!selected.isPlaylist);
      setCurrentVideoTitle(selected.title);
    }
  };

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
            {currentVideoUrl ? (
                <div className="aspect-video w-full">
                    <iframe
                    src={currentVideoUrl}
                    title={currentVideoTitle || module.title}
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
            {currentVideoIsPlaylist && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="playlist-info">
                  <AccordionTrigger className="text-sm py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground/90 rounded-md px-3 border border-primary/30 hover:no-underline hover:bg-primary/20">
                    <div className="flex items-center">
                      <ListVideo className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span className="font-medium">This is a YouTube Playlist: How to Navigate</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-3 text-xs text-muted-foreground border border-t-0 rounded-b-md bg-background">
                    <p className="mb-1">You are currently viewing a YouTube playlist. To see all videos in this series and navigate between them, please use the controls available **within the YouTube player itself** (usually an icon showing a list or "1/X" videos).</p>
                    <p>A feature to display a clickable list of all videos in this playlist directly on this page is planned for a future update. For now, rely on the YouTube player's interface for playlist navigation.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
                            <span className="truncate" title={video.title}>{video.title || 'Untitled Video'} ({video.langName}) {video.isPlaylist ? " (Playlist)" : ""}
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
            </div>
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
