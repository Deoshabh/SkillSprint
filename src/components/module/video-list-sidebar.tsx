'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Video, Search, Plus, Loader2, AlertTriangle, X, Trash2, PlayCircle, ChevronRight, Clock, Globe } from 'lucide-react';
import { VideoItem, VideoState } from '@/lib/module-api';
import { isPlaylistUrl } from '@/lib/video-utils';

interface Playlist {
  id: string;
  title: string;
  videos: VideoItem[];
  type: 'module' | 'ai-search' | 'custom';
}

interface VideoListSidebarProps {
  playlists: Playlist[];
  currentVideo: VideoItem | null;
  videoState: VideoState;
  expandedPlaylists: string[];
  expandedPlaylistItems: Record<string, boolean>;
  loadingPlaylistItems: Record<string, boolean>;
  playlistItemsCache: Record<string, VideoItem[]>;
  leftSidebarOpen: boolean;
  aiSearchQuery: string;
  aiSearchLoading: boolean;
  customUrl: string;
  customUrlLoading: boolean;
  loading: boolean;
  onSetExpandedPlaylists: (playlists: string[]) => void;
  onVideoSelect: (video: VideoItem) => void;
  onRemoveVideo: (videoId: string) => void;
  onPlaylistItemsToggle: (videoId: string, playlistId: string) => void;
  onSetLeftSidebarOpen: (open: boolean) => void;
  onSetAiSearchQuery: (query: string) => void;
  onAiSearch: () => void;
  onSetCustomUrl: (url: string) => void;
  onAddCustomUrl: () => void;
  validateYouTubeUrl: (url: string) => boolean;
  isPlaylistUrl: (url: string) => boolean;
}

const generateThumbnail = (url: string): string => {
  if (!url) return '';
  
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
  }
  
  return '';
};

export function VideoListSidebar({
  playlists,
  currentVideo,
  videoState,
  expandedPlaylists,
  expandedPlaylistItems,
  loadingPlaylistItems,
  playlistItemsCache,
  leftSidebarOpen,
  aiSearchQuery,
  aiSearchLoading,
  customUrl,
  customUrlLoading,
  loading,
  onSetExpandedPlaylists,
  onVideoSelect,
  onRemoveVideo,
  onPlaylistItemsToggle,
  onSetLeftSidebarOpen,
  onSetAiSearchQuery,
  onAiSearch,
  onSetCustomUrl,
  onAddCustomUrl,
  validateYouTubeUrl,
  isPlaylistUrl
}: VideoListSidebarProps) {
  return (
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
                onClick={() => onSetLeftSidebarOpen(false)}
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
                onChange={(e) => onSetAiSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAiSearch()}
                className="flex-1"
                disabled={videoState.aiSearchCount >= 2}
              />
              <Button
                onClick={onAiSearch}
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
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add YouTube video or playlist URL..."
                  value={customUrl}
                  onChange={(e) => onSetCustomUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddCustomUrl()}
                  className="flex-1"
                />
                <Button
                  onClick={onAddCustomUrl}
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
              
              {customUrl.trim() && isPlaylistUrl(customUrl) && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  📋 Playlist detected - This will add individual videos
                </p>
              )}
              {customUrl.trim() && !isPlaylistUrl(customUrl) && validateYouTubeUrl(customUrl) && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  🎥 Single video detected
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : playlists && playlists.length > 0 ? (
            <Accordion 
              type="multiple" 
              value={expandedPlaylists || []} 
              onValueChange={onSetExpandedPlaylists}
              className="w-full"
            >
              {playlists.map((playlist) => (
                <AccordionItem key={playlist.id} value={playlist.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center justify-between w-full mr-4">
                      <span className="font-medium">{playlist.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {playlist.videos.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {playlist.videos.map((video) => (
                        <div key={video.id} className="space-y-2">
                          {/* Enhanced Main video card */}
                          <div
                            className={`
                              group cursor-pointer transition-all duration-200 p-3 rounded-lg border-l-4 border-transparent hover:border-primary/50
                              ${currentVideo?.id === video.id 
                                ? 'bg-primary/10 border-l-primary shadow-sm' 
                                : 'hover:bg-muted/50'
                              }
                            `}
                            onClick={() => onVideoSelect(video)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Enhanced Thumbnail */}
                              <div className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-sm">
                                {video.thumbnail ? (
                                  <img
                                    src={video.thumbnail}
                                    alt={video.title || 'Video thumbnail'}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                    <Video className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                
                                {/* Duration Badge */}
                                {video.duration && (
                                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
                                    {video.duration}
                                  </div>
                                )}
                                
                                {/* Playlist indicator */}
                                {video.url && isPlaylistUrl(video.url) && (
                                  <div className="absolute top-1 left-1 bg-blue-500/90 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span>📋</span>
                                    <span className="text-xs">PL</span>
                                  </div>
                                )}
                                
                                {/* Play overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                  <PlayCircle className="h-8 w-8 text-white drop-shadow-lg" />
                                </div>
                              </div>

                              {/* Video Info */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <h4 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                  {video.title || 'Untitled Video'}
                                </h4>
                                
                                {/* Creator/Channel info */}
                                {video.creator && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {video.creator}
                                  </p>
                                )}
                                
                                {/* Metadata row */}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                  {video.url && isPlaylistUrl(video.url) && (
                                    <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                      📋 Playlist
                                    </span>
                                  )}
                                  {video.language && video.language !== 'English' && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {video.language}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Playlist expansion button */}
                                {video.url && isPlaylistUrl(video.url) && video.playlistId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPlaylistItemsToggle(video.id, video.playlistId!);
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Expand playlist"
                                  >
                                    {loadingPlaylistItems[`${video.id}-${video.playlistId}`] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : expandedPlaylistItems[`${video.id}-${video.playlistId}`] ? (
                                      <ChevronRight className="h-4 w-4 rotate-90" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                
                                {/* Remove button for custom and AI videos */}
                                {(video.source === 'custom' || video.source === 'ai') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveVideo(video.id);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                    title="Remove video"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Enhanced Playlist items */}
                            {video.url && 
                             isPlaylistUrl(video.url) && 
                             video.playlistId && 
                             expandedPlaylistItems[`${video.id}-${video.playlistId}`] && 
                             playlistItemsCache[`${video.id}-${video.playlistId}`] && (
                              <div className="mt-3 ml-6 pl-4 border-l-2 border-muted space-y-2">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="h-px bg-muted flex-1"></div>
                                  <span className="text-xs text-muted-foreground font-medium bg-background px-2">
                                    {playlistItemsCache[`${video.id}-${video.playlistId}`].length} videos in playlist
                                  </span>
                                  <div className="h-px bg-muted flex-1"></div>
                                </div>
                                
                                {playlistItemsCache[`${video.id}-${video.playlistId}`].map((item, index) => (
                                  <div
                                    key={item.id}
                                    className={`
                                      group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-150
                                      ${currentVideo?.id === item.id 
                                        ? 'bg-primary/10 border border-primary/30 shadow-sm' 
                                        : 'hover:bg-muted/30'
                                      }
                                    `}
                                    onClick={() => onVideoSelect(item)}
                                  >
                                    {/* Index number */}
                                    <div className="text-xs text-muted-foreground font-mono w-6 text-center">
                                      {index + 1}
                                    </div>
                                    
                                    {/* Smaller thumbnail for playlist items */}
                                    <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                                      {item.thumbnail ? (
                                        <img
                                          src={item.thumbnail}
                                          alt={item.title || 'Video thumbnail'}
                                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Video className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                        <PlayCircle className="h-3 w-3 text-white drop-shadow-lg" />
                                      </div>
                                    </div>
                                    
                                    {/* Video info for playlist item */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-xs line-clamp-2 group-hover:text-primary transition-colors">
                                        {item.title || 'Untitled Video'}
                                      </p>
                                      {item.creator && item.creator !== 'YouTube' && (
                                        <p className="text-xs text-muted-foreground">
                                          {item.creator}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No videos available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some videos using the search or URL input above
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
