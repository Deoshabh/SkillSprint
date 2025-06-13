
"use client";
import type { Module, VideoLink } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, Video, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect, useMemo } from 'react';

interface MediaPlayerProps {
  module: Module;
  aiFetchedVideos?: VideoLink[];
  onSearchWithAI?: () => void;
  isAISearching?: boolean;
}

export function MediaPlayer({ module, aiFetchedVideos = [], onSearchWithAI, isAISearching = false }: MediaPlayerProps) {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [selectedVideoKey, setSelectedVideoKey] = useState<string>('');


  const allAvailableVideos = useMemo(() => {
    let videos: VideoLink[] = [];
    if (module.contentType === 'video') {
      if (module.contentUrl) {
        // Check if it's a YouTube embed URL
        if (module.contentUrl.includes('youtube.com/embed/')) {
          videos.push({
            langCode: 'en',
            langName: 'English (Default)',
            youtubeEmbedUrl: module.contentUrl,
            title: `${module.title} (Default)`,
          });
        }
      }
      if (module.videoLinks) {
        videos = videos.concat(module.videoLinks);
      }
      if (aiFetchedVideos) {
        videos = videos.concat(aiFetchedVideos);
      }
      // Deduplicate based on URL
      const uniqueVideos = new Map<string, VideoLink>();
      videos.forEach(video => {
        if (!uniqueVideos.has(video.youtubeEmbedUrl)) {
          uniqueVideos.set(video.youtubeEmbedUrl, video);
        }
      });
      return Array.from(uniqueVideos.values());
    }
    return [];
  }, [module, aiFetchedVideos]);

  useEffect(() => {
    if (module.contentType === 'video' && allAvailableVideos.length > 0) {
      const defaultEnglishVideo = allAvailableVideos.find(v => v.langCode === 'en');
      const firstVideoUrl = defaultEnglishVideo?.youtubeEmbedUrl || allAvailableVideos[0]?.youtubeEmbedUrl;
      if (firstVideoUrl) {
        setCurrentVideoUrl(firstVideoUrl);
        setSelectedVideoKey(firstVideoUrl);
      } else {
        setCurrentVideoUrl(null);
        setSelectedVideoKey('');
      }
    } else if (module.contentType !== 'video') {
        setCurrentVideoUrl(null); // Reset for non-video content
        setSelectedVideoKey('');
    } else {
        setCurrentVideoUrl(null);
        setSelectedVideoKey('');
    }
  }, [allAvailableVideos, module.contentType]);

  const handleVideoSelectionChange = (url: string) => {
    setCurrentVideoUrl(url);
    setSelectedVideoKey(url);
  };

  const renderContent = () => {
    switch (module.contentType) {
      case 'video':
        if (allAvailableVideos.length === 0 && !isAISearching) {
          return (
            <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center">
              <Video className="h-16 w-16 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-4">No video available for this module yet.</p>
              {onSearchWithAI && (
                <Button onClick={onSearchWithAI}>
                  <Search className="h-4 w-4 mr-2" /> Search for Videos with AI
                </Button>
              )}
            </div>
          );
        }
        if (isAISearching) {
            return (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Searching for videos with AI...</p>
              </div>
            );
        }
        if (!currentVideoUrl && allAvailableVideos.length > 0) {
             // This case should be handled by useEffect setting an initial video
            return <p>Loading video...</p>;
        }
         if (!currentVideoUrl && allAvailableVideos.length === 0) {
            // This state implies AI search hasn't been triggered or yielded no results yet.
            // The button to trigger AI search is shown above.
            return <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center">
              <Video className="h-16 w-16 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Still no video. Try AI search if available.</p>
            </div>;
        }

        return (
          <div className="space-y-4">
            {allAvailableVideos.length > 1 && (
              <div className="max-w-xs">
                <Select value={selectedVideoKey} onValueChange={handleVideoSelectionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a video/language" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAvailableVideos.map((video) => (
                      <SelectItem key={video.youtubeEmbedUrl} value={video.youtubeEmbedUrl}>
                        {video.title} ({video.langName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
             {currentVideoUrl ? (
                <div className="aspect-video w-full">
                    <iframe
                    src={currentVideoUrl}
                    title={module.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                    ></iframe>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center">
                    <Video className="h-16 w-16 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Video could not be loaded.</p>
                 </div>
            )}
             {allAvailableVideos.length === 0 && onSearchWithAI && !isAISearching && (
                 <Button onClick={onSearchWithAI} className="mt-4">
                  <Search className="h-4 w-4 mr-2" /> Search for Videos with AI
                </Button>
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
