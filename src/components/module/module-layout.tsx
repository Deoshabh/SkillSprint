'use client';

import React from 'react';
import { VideoPlayer } from './video-player';
import { PlaylistSection } from './playlist-section';
import { VideoListSidebar } from './video-list-sidebar';
import { CourseNavigation } from './course-navigation';
import { VideoItem, VideoState, Course, Module } from '@/lib/module-api';

interface Playlist {
  id: string;
  title: string;
  videos: VideoItem[];
  type: 'module' | 'ai-search' | 'custom';
}

interface PlaylistInfo {
  id: string;
  title: string;
  videos: VideoItem[];
  currentIndex: number;
}

interface ModuleLayoutProps {
  // Video player props
  currentVideo: VideoItem | null;
  currentModule: Module | null;
  course: Course | null;
  courseId: string;
  moduleId: string;
  
  // Video player state
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  
  // Video player handlers
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onToggleFullscreen: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  
  // Playlist data
  currentVideoPlaylist: PlaylistInfo | null;
  playlists: Playlist[];
  
  // Sidebar state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  onCloseSidebars: () => void;
  
  // Video list props
  videoState: VideoState;
  expandedPlaylists: string[];
  expandedPlaylistItems: Record<string, boolean>;
  loadingPlaylistItems: Record<string, boolean>;
  playlistItemsCache: Record<string, VideoItem[]>;
  
  // Search state
  aiSearchQuery: string;
  aiSearchLoading: boolean;
  customUrl: string;
  customUrlLoading: boolean;
    // Handlers
  onVideoSelect: (video: VideoItem) => void;
  onSetExpandedPlaylists: (playlists: string[]) => void;
  onTogglePlaylistItems: (videoId: string, playlistId: string) => void;
  onRemoveVideo: (videoId: string) => void;
  onAiSearch: () => void;
  onAddCustomUrl: () => void;
  onSetAiSearchQuery: (query: string) => void;
  onSetCustomUrl: (url: string) => void;
  onSetLeftSidebarOpen: (open: boolean) => void;
}

export function ModuleLayout({
  currentVideo,
  currentModule,
  course,
  courseId,
  moduleId,
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
  currentVideoPlaylist,
  playlists,
  leftSidebarOpen,
  rightSidebarOpen,
  onCloseSidebars,
  videoState,
  expandedPlaylists,
  expandedPlaylistItems,
  loadingPlaylistItems,
  playlistItemsCache,
  aiSearchQuery,
  aiSearchLoading,
  customUrl,
  customUrlLoading,  onVideoSelect,
  onTogglePlaylistItems,
  onRemoveVideo,
  onAiSearch,
  onAddCustomUrl,
  onSetAiSearchQuery,
  onSetCustomUrl,
  onSetExpandedPlaylists,
  onSetLeftSidebarOpen
}: ModuleLayoutProps) {
  
  if (currentVideoPlaylist) {
    // Layout when playlist video is playing
    return (
      <div className="space-y-6">
        {/* Video Player */}
        <VideoPlayer
          currentVideo={currentVideo}
          currentModule={currentModule}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          onPlay={onPlay}
          onPause={onPause}
          onToggleMute={onToggleMute}
          onVolumeChange={onVolumeChange}
          onSeek={onSeek}
          onToggleFullscreen={onToggleFullscreen}
          onTimeUpdate={onTimeUpdate}
          onDurationChange={onDurationChange}
          isPlaylistVideo={true}
        />

        {/* Playlist Section */}
        <PlaylistSection
          playlist={currentVideoPlaylist}
          currentVideo={currentVideo}
          onVideoSelect={onVideoSelect}
        />

        {/* Video List Sidebar below playlist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">            <VideoListSidebar
              playlists={playlists}
              currentVideo={currentVideo}
              videoState={videoState}
              expandedPlaylists={expandedPlaylists}
              expandedPlaylistItems={expandedPlaylistItems}
              loadingPlaylistItems={loadingPlaylistItems}
              playlistItemsCache={playlistItemsCache}
              leftSidebarOpen={false} // Always show inline in this layout
              aiSearchQuery={aiSearchQuery}
              aiSearchLoading={aiSearchLoading}
              customUrl={customUrl}
              customUrlLoading={customUrlLoading}
              loading={false}
              onVideoSelect={onVideoSelect}
              onPlaylistItemsToggle={onTogglePlaylistItems}
              onRemoveVideo={onRemoveVideo}
              onAiSearch={onAiSearch}
              onAddCustomUrl={onAddCustomUrl}
              onSetAiSearchQuery={onSetAiSearchQuery}
              onSetCustomUrl={onSetCustomUrl}
              onSetExpandedPlaylists={onSetExpandedPlaylists}
              onSetLeftSidebarOpen={onSetLeftSidebarOpen}
              validateYouTubeUrl={() => true}
              isPlaylistUrl={() => false}
            />
          </div>
          
          <div>
            <CourseNavigation
              course={course}
              currentModuleId={moduleId}
              courseId={courseId}
            />
          </div>
        </div>
      </div>
    );
  }

  // Original Layout when no playlist video is playing
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Video List */}
      <div className={`
        lg:col-span-3 
        ${leftSidebarOpen ? 'fixed inset-0 z-50 bg-background' : 'hidden lg:block'}
      `}>        <VideoListSidebar
          playlists={playlists}
          currentVideo={currentVideo}
          videoState={videoState}
          expandedPlaylists={expandedPlaylists}
          expandedPlaylistItems={expandedPlaylistItems}
          loadingPlaylistItems={loadingPlaylistItems}
          playlistItemsCache={playlistItemsCache}
          leftSidebarOpen={leftSidebarOpen}
          aiSearchQuery={aiSearchQuery}
          aiSearchLoading={aiSearchLoading}
          customUrl={customUrl}
          customUrlLoading={customUrlLoading}
          loading={false}
          onVideoSelect={onVideoSelect}
          onPlaylistItemsToggle={onTogglePlaylistItems}
          onRemoveVideo={onRemoveVideo}
          onAiSearch={onAiSearch}
          onAddCustomUrl={onAddCustomUrl}
          onSetAiSearchQuery={onSetAiSearchQuery}
          onSetCustomUrl={onSetCustomUrl}
          onSetExpandedPlaylists={onSetExpandedPlaylists}
          onSetLeftSidebarOpen={onSetLeftSidebarOpen}
          validateYouTubeUrl={() => true}
          isPlaylistUrl={() => false}
        />
      </div>      {/* Main Content - Video Player */}
      <div className="lg:col-span-5 flex flex-col">
        <VideoPlayer
          currentVideo={currentVideo}
          currentModule={currentModule}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          onPlay={onPlay}
          onPause={onPause}
          onToggleMute={onToggleMute}
          onVolumeChange={onVolumeChange}
          onSeek={onSeek}
          onToggleFullscreen={onToggleFullscreen}
          onTimeUpdate={onTimeUpdate}
          onDurationChange={onDurationChange}
          isPlaylistVideo={false}
        />
      </div>

      {/* Right Sidebar - Course Navigation */}
      <div className={`
        lg:col-span-4 
        ${rightSidebarOpen ? 'fixed inset-0 z-50 bg-background' : 'hidden lg:block'}
      `}>
        <CourseNavigation
          course={course}
          currentModuleId={moduleId}
          courseId={courseId}
        />
      </div>
    </div>
  );
}
