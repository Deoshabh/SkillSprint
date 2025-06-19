'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, PlayCircle, Video } from 'lucide-react';
import { VideoItem } from '@/lib/module-api';

interface PlaylistSectionProps {
  playlist: {
    id: string;
    title: string;
    videos: VideoItem[];
    currentIndex: number;
  };
  currentVideo: VideoItem | null;
  onVideoSelect: (video: VideoItem) => void;
}

export function PlaylistSection({ playlist, currentVideo, onVideoSelect }: PlaylistSectionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          📋 {playlist.title}
          <Badge variant="outline" className="ml-2">
            {playlist.currentIndex + 1} / {playlist.videos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
          {playlist.videos.map((video, index) => (
            <div
              key={video.id}
              className={`
                group cursor-pointer transition-all duration-200 p-3 rounded-lg border
                ${currentVideo?.id === video.id 
                  ? 'bg-primary/10 border-primary' 
                  : 'hover:bg-muted/50 border-muted'
                }
              `}
              onClick={() => onVideoSelect(video)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                  {index + 1}
                </span>
                {currentVideo?.id === video.id && (
                  <div className="flex items-center text-primary">
                    <Play className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">Now Playing</span>
                  </div>
                )}
              </div>
              
              <div className="relative w-full h-20 rounded overflow-hidden bg-muted mb-2">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title || 'Video thumbnail'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <PlayCircle className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
              </div>
              
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {video.title || 'Untitled Video'}
              </h4>
              
              {video.creator && (
                <p className="text-xs text-muted-foreground">
                  {video.creator}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
