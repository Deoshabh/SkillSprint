'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, Volume2, VolumeX, Maximize, Video } from 'lucide-react';
import { VideoItem } from '@/lib/module-api';
import { formatTime, isPlaylistUrl } from '@/lib/video-utils';

interface VideoPlayerProps {
  currentVideo: VideoItem | null;
  currentModule: any;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onToggleFullscreen: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  isPlaylistVideo?: boolean;
}

export function VideoPlayer({
  currentVideo,
  currentModule,
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  onPlay,
  onPause,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onToggleFullscreen,
  onTimeUpdate,
  onDurationChange,
  isPlaylistVideo = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        onPause();
      } else {
        videoRef.current.play();
        onPlay();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      onToggleMute();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  return (
    <Card className={`w-full ${isPlaylistVideo ? '' : 'h-full flex flex-col'}`}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl line-clamp-1">
              {currentModule?.title || 'Loading...'}
            </CardTitle>
            {currentVideo && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground text-sm line-clamp-1">
                  {currentVideo.title || 'Untitled Video'}
                </p>
                {currentVideo.url && isPlaylistUrl(currentVideo.url) && (
                  <Badge variant="secondary" className="text-xs">
                    📋 Playlist
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentModule?.estimatedTime && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {currentModule.estimatedTime}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${isPlaylistVideo ? '' : 'flex-1 flex flex-col'}`}>
        {currentVideo && (currentVideo.url || currentVideo.youtubeEmbedUrl) ? (
          <div className={`${isPlaylistVideo ? '' : 'flex-1'} flex flex-col`}>
            {/* Video Container */}
            <div className={`relative ${isPlaylistVideo ? 'h-[50vh]' : 'flex-1'} bg-black rounded-lg overflow-hidden`}>
              {((currentVideo.url && typeof currentVideo.url === 'string' && 
                (currentVideo.url.includes('youtube.com') || currentVideo.url.includes('youtu.be'))) || 
                currentVideo.youtubeEmbedUrl) ? (
                <iframe
                  src={`${currentVideo.youtubeEmbedUrl || currentVideo.url}${
                    (currentVideo.youtubeEmbedUrl || currentVideo.url).includes('?') ? '&' : '?'
                  }autoplay=1&rel=0`}
                  title={currentVideo.title || 'Video Player'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentVideo.url}
                  className="w-full h-full"
                  onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
                  onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
                  onPlay={onPlay}
                  onPause={onPause}
                />
              )}
            </div>

            {/* Video Controls (for non-YouTube videos) */}
            {currentVideo.url && 
             typeof currentVideo.url === 'string' && 
             !currentVideo.url.includes('youtube.com') && 
             !currentVideo.url.includes('youtu.be') && 
             !currentVideo.youtubeEmbedUrl && (
              <div className="mt-4 space-y-3">
                {/* Progress Bar */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground min-w-[45px]">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-muted-foreground min-w-[45px]">
                    {formatTime(duration)}
                  </span>
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

                  <Button onClick={onToggleFullscreen} variant="outline" size="sm">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`${isPlaylistVideo ? 'h-[50vh]' : 'flex-1'} flex items-center justify-center bg-muted rounded-lg`}>
            <div className="text-center">
              <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a video to start learning</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
