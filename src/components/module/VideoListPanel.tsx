'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Video, Search, Plus, Loader2, AlertTriangle, Play, Clock, Globe, Trash2, Bot, User, BookOpen, Edit2, Check, X } from 'lucide-react';
import { VideoItem, VideoState } from '@/lib/module-api';
import { isPlaylistUrl } from '@/lib/video-utils';

// Add some extra styles for the collapsible panel
import './video-panel.css';

interface Playlist {
  id: string;
  title: string;
  videos: VideoItem[];
  type: 'module' | 'ai-search' | 'custom';
}

interface VideoListPanelProps {
  playlists: Playlist[];
  currentVideo: VideoItem | null;
  videoState: VideoState;
  aiSearchQuery: string;
  aiSearchLoading: boolean;
  customUrl: string;
  customUrlLoading: boolean;
  loading: boolean;
  maxCustomVideos: number;
  maxAiSearches: number;
  user?: any; // User object from auth context
  onVideoSelect: (video: VideoItem) => void;
  onRemoveVideo: (videoId: string) => void;
  onRenameVideo: (videoId: string, newTitle: string) => void;
  onSetAiSearchQuery: (query: string) => void;
  onAiSearch: () => void;
  onSetCustomUrl: (url: string) => void;
  onAddCustomUrl: () => void;
  validateYouTubeUrl: (url: string) => boolean;
  isPlaylistUrl: (url: string) => boolean;
}

export function VideoListPanel({
  playlists,
  currentVideo,
  videoState,
  aiSearchQuery,
  aiSearchLoading,
  customUrl,
  customUrlLoading,
  loading,
  maxCustomVideos,
  maxAiSearches,
  user,
  onVideoSelect,
  onRemoveVideo,
  onRenameVideo,
  onSetAiSearchQuery,
  onAiSearch,
  onSetCustomUrl,
  onAddCustomUrl,
  validateYouTubeUrl,
  isPlaylistUrl
}: VideoListPanelProps) {
  // State for rename functionality
  const [renamingVideoId, setRenamingVideoId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // State for collapsed/expanded panel with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("videoListPanelCollapsed");
      return savedState === "true";
    }
    return false;
  });
  
  // Toggle collapsed state with function for keyboard shortcuts
  const toggleCollapsed = React.useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("videoListPanelCollapsed", String(newState));
  }, [isCollapsed]);
  
  // Add keyboard shortcut (Alt+V) to toggle panel
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'v') {
        toggleCollapsed();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);
  
  // Organize playlists by type
  const modulePlaylist = playlists.find(p => p.type === 'module');
  const aiPlaylist = playlists.find(p => p.type === 'ai-search');
  const customPlaylist = playlists.find(p => p.type === 'custom');

  // Handle rename functions
  const startRename = (video: VideoItem) => {
    setRenamingVideoId(video.id);
    setRenameValue(video.title || '');
  };

  const cancelRename = () => {
    setRenamingVideoId(null);
    setRenameValue('');
  };

  const saveRename = () => {
    if (renamingVideoId && renameValue.trim()) {
      onRenameVideo(renamingVideoId, renameValue.trim());
    }
    cancelRename();
  };

  const renderVideoCard = (video: VideoItem, showRemoveButton: boolean = false) => (
    <div
      key={video.id}
      className={`
        group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
        ${currentVideo?.id === video.id 
          ? 'bg-primary/10 border-primary shadow-sm ring-2 ring-primary/20 scale-[1.02]' 
          : 'bg-card hover:bg-accent/50 border-border hover:border-primary/30 hover:scale-[1.01]'
        }
      `}
      onClick={() => onVideoSelect(video)}
    >
      {/* Current video indicator */}
      {currentVideo?.id === video.id && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
      )}
      
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title || 'Video thumbnail'}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                // If thumbnail fails to load, hide image and show fallback
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback when no thumbnail or thumbnail fails to load */}
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 ${video.thumbnail ? 'hidden' : ''}`}>
            <Video className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          </div>
          
          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded font-mono">
              {video.duration}
            </div>
          )}
          
          {/* Playlist indicator */}
          {video.url && isPlaylistUrl(video.url) && (
            <div className="absolute top-0.5 left-0.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-1.5 py-0.5 rounded-md font-medium shadow-sm">
              <div className="flex items-center gap-1">
                <span>📋</span>
                <span>PL</span>
              </div>
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <Play className="h-4 w-4 text-white drop-shadow-lg" fill="white" />
          </div>
        </div>
        
        {/* Video Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title with rename functionality */}
          {renamingVideoId === video.id ? (
            <div className="flex items-center gap-1">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveRename();
                  } else if (e.key === 'Escape') {
                    cancelRename();
                  }
                }}
                className="h-6 text-xs font-medium"
                autoFocus
                onBlur={saveRename}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={saveRename}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelRename}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {video.title || (video.source === 'custom' ? 'Custom Video' : video.source === 'ai' ? 'AI Suggested Video' : 'Module Video')}
            </h4>
          )}
          
          {/* Creator/Channel info */}
          {video.creator && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {video.creator}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {video.language && video.language !== 'English' && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {video.language}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons for custom and AI videos */}
        {showRemoveButton && (video.source === 'custom' || video.source === 'ai') && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Rename button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                startRename(video);
              }}
              className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              title="Rename video"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            
            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveVideo(video.id);
              }}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Remove video"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderVideoSection = (
    title: string, 
    videos: VideoItem[], 
    icon: React.ReactNode, 
    showRemoveButton: boolean = false,
    maxVisible: number = 8,
    sectionColor: string = 'text-foreground'
  ) => {
    if (!videos || videos.length === 0) return null;

    return (
      <div className="space-y-3 module-videos-section">
        {/* Section Header */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className={`font-medium text-sm ${sectionColor}`}>{title}</h3>
            <Badge variant="secondary" className="text-xs">
              {videos.length}
            </Badge>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {videos.slice(0, maxVisible).map((video) => renderVideoCard(video, showRemoveButton))}
        </div>

        {/* Show more indicator */}
        {videos.length > maxVisible && (
          <p className="text-xs text-muted-foreground text-center py-1 bg-muted/20 rounded">
            +{videos.length - maxVisible} more videos available
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className={`flex flex-col video-list-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Module Videos & Search
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Total: {playlists.reduce((acc, p) => acc + p.videos.length, 0)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="collapse-toggle"
              title={isCollapsed ? "Show videos (Alt+V)" : "Hide videos (Alt+V)"}
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </Button>
          </div>
        </CardTitle>
        
        {/* Search area - Always visible */}
        <div className="space-y-2 search-area">
          {!user ? (
            <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground text-center">
                🔐 Please log in to access AI video search and custom video features
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 search-area">
                <Input
                  placeholder="Search AI videos..."
                  value={aiSearchQuery}
                  onChange={(e) => onSetAiSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAiSearch()}
                  className="flex-1 h-8 text-sm"
                  disabled={videoState.aiSearchCount >= maxAiSearches}
                />
                <Button
                  onClick={onAiSearch}
                  disabled={aiSearchLoading || !aiSearchQuery.trim() || videoState.aiSearchCount >= maxAiSearches}
                  size="sm"
                  className="h-8 px-3"
                >
                  {aiSearchLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Search className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* AI Search Usage Indicator */}
              <div className="flex items-center justify-between text-xs search-area">
                <div className="flex items-center gap-2">
                  <Bot className="h-3 w-3" />
                  <span className="text-muted-foreground">
                    AI searches used: {videoState.aiSearchCount} / {maxAiSearches} per module
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress dots */}
                  <div className="flex gap-1">
                    {Array.from({ length: maxAiSearches }, (_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index < videoState.aiSearchCount
                            ? 'bg-purple-500' 
                            : 'bg-muted border border-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  {videoState.aiSearchCount >= maxAiSearches && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Limit reached</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom URL Input */}
              <div className="space-y-2 search-area">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add YouTube video or playlist URL..."
                    value={customUrl}
                    onChange={(e) => onSetCustomUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onAddCustomUrl()}
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    onClick={onAddCustomUrl}
                    disabled={customUrlLoading || !customUrl.trim() || !validateYouTubeUrl(customUrl) || (customPlaylist?.videos.length || 0) >= maxCustomVideos}
                    size="sm"
                    className="h-8 px-3"
                  >
                    {customUrlLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Custom Video Usage Indicator */}
                <div className="flex items-center justify-between text-xs search-area">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="text-muted-foreground">
                      Custom videos: {customPlaylist?.videos.length || 0} / {maxCustomVideos} limit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Progress dots */}
                    <div className="flex gap-1">
                      {[...Array(maxCustomVideos)].map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            index < (customPlaylist?.videos.length || 0)
                              ? 'bg-green-500' 
                              : 'bg-muted border border-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    {(customPlaylist?.videos.length || 0) >= maxCustomVideos && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Limit reached</span>
                      </div>
                    )}
                  </div>
                </div>
              
                {/* URL Validation Feedback */}
                {customUrl.trim() && (
                  <div className="text-xs search-area">
                    {isPlaylistUrl(customUrl) ? (
                      <p className="text-blue-600 dark:text-blue-400">
                        📋 Playlist detected - Individual videos will be added
                      </p>
                    ) : validateYouTubeUrl(customUrl) ? (
                      <p className="text-green-600 dark:text-green-400">
                        🎥 Valid YouTube video URL
                      </p>
                    ) : (
                      <p className="text-red-600 dark:text-red-400">
                        ❌ Please enter a valid YouTube URL
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardHeader>
      
      {/* Card content - Contains video sections */}
      <CardContent className="flex-1 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="video-sections">
            {/* Module Videos Section */}
            {renderVideoSection(
              'Course Videos', 
              modulePlaylist?.videos || [], 
              <BookOpen className="h-4 w-4 text-blue-600" />,
              false,
              6,
              'text-blue-700 dark:text-blue-400'
            )}

            {/* AI Suggested Videos Section */}
            {renderVideoSection(
              'AI Suggested Videos', 
              aiPlaylist?.videos || [], 
              <Bot className="h-4 w-4 text-purple-600" />,
              true,
              6,
              'text-purple-700 dark:text-purple-400'
            )}

            {/* Custom Videos Section */}
            {renderVideoSection(
              'Your Custom Videos', 
              customPlaylist?.videos || [], 
              <User className="h-4 w-4 text-green-600" />,
              true,
              6,
              'text-green-700 dark:text-green-400'
            )}

            {/* Empty State */}
            {playlists.length === 0 && (
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No videos available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for AI videos or add custom YouTube URLs above
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
