
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
            langCode: 'en', // Assuming default is English if not specified
            langName: 'English (Module Default)',
            youtubeEmbedUrl: module.contentUrl,
            title: `${module.title} (Module Default)`,
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
      // Try to maintain current selection if it's still in the list, otherwise pick default
      const isCurrentSelectionValid = allAvailableVideos.some(v => v.youtubeEmbedUrl === selectedVideoKey);
      if (isCurrentSelectionValid && currentVideoUrl) {
        // No change needed if current selection is still valid
      } else {
        const defaultEnglishVideo = allAvailableVideos.find(v => v.langCode === 'en' || v.langName.toLowerCase().includes('english'));
        const firstVideoUrl = defaultEnglishVideo?.youtubeEmbedUrl || allAvailableVideos[0]?.youtubeEmbedUrl;
        if (firstVideoUrl) {
          setCurrentVideoUrl(firstVideoUrl);
          setSelectedVideoKey(firstVideoUrl);
        } else {
          setCurrentVideoUrl(null);
          setSelectedVideoKey('');
        }
      }
    } else if (module.contentType !== 'video') {
        setCurrentVideoUrl(null); 
        setSelectedVideoKey('');
    } else { // Video content type but no videos
        setCurrentVideoUrl(null);
        setSelectedVideoKey('');
    }
  }, [allAvailableVideos, module.contentType, selectedVideoKey, currentVideoUrl]);

  const handleVideoSelectionChange = (url: string) => {
    setCurrentVideoUrl(url);
    setSelectedVideoKey(url);
  };

  const renderContent = () => {
    switch (module.contentType) {
      case 'video':
        if (isAISearching) {
            return (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg aspect-video">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">AI is searching for more videos...</p>
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
            {allAvailableVideos.length > 0 && currentVideoUrl ? (
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
                 <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg p-4 text-center aspect-video">
                    <Video className="h-16 w-16 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Video could not be loaded or none selected.</p>
                 </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                {allAvailableVideos.length > 0 && (
                <div className="w-full sm:flex-grow">
                    <Select value={selectedVideoKey} onValueChange={handleVideoSelectionChange} disabled={allAvailableVideos.length <= 1 && !onSearchWithAI}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a video version" />
                    </SelectTrigger>
                    <SelectContent>
                        {allAvailableVideos.map((video) => (
                        <SelectItem key={video.youtubeEmbedUrl} value={video.youtubeEmbedUrl}>
                            {video.title} ({video.langName})
                            {video.creator && <span className="text-xs text-muted-foreground ml-1"> - by {video.creator}</span>}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                )}
                {onSearchWithAI && (
                    <Button onClick={onSearchWithAI} variant="outline" className="w-full sm:w-auto flex-shrink-0" disabled={isAISearching}>
                        <Search className="h-4 w-4 mr-2" />
                        {isAISearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Find More Videos'}
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
