/**
 * 
 * Standalone video management service
 * Handles video operations with graceful fallbacks when auth is unavailable
 */

import type { VideoLink } from '@/lib/types';
import { normalizeYouTubeUrl, generateVideoId, checkYouTubeAvailability } from '@/lib/youtube-utils';

export interface VideoManagementResult {
  success: boolean;
  error?: string;
  video?: VideoLink;
  videos?: VideoLink[];
}

export interface AddVideoParams {
  url: string;
  title: string;
  language: string;
  creator?: string;
  isPlaylist?: boolean;
  notes?: string;
}

export interface VideoServiceState {
  userVideos: VideoLink[];
  aiVideos: VideoLink[];
  aiSearchCount: number;
}

export class VideoService {
  private moduleKey: string;
  private maxUserVideos: number;
  private maxAISearches: number;
  
  constructor(
    courseId: string, 
    moduleId: string, 
    maxUserVideos: number = 5,
    maxAISearches: number = 2
  ) {
    this.moduleKey = `${courseId}-${moduleId}`;
    this.maxUserVideos = maxUserVideos;
    this.maxAISearches = maxAISearches;
  }  /**
   * Load video state from user profile or return empty state
   */
  loadState(userProfile?: any): VideoServiceState {
    console.log(`[VideoService.loadState] Starting for moduleKey: ${this.moduleKey}`, {
      hasUserProfile: !!userProfile,
      userProfile: userProfile ? {
        id: userProfile._id || userProfile.id,
        email: userProfile.email,
        userModuleVideos: userProfile.userModuleVideos,
        userAIVideos: userProfile.userAIVideos,
        userAISearchUsage: userProfile.userAISearchUsage
      } : null
    });

    if (!userProfile) {
      console.log(`[VideoService.loadState] No user profile, returning empty state`);
      return {
        userVideos: [],
        aiVideos: [],
        aiSearchCount: 0
      };
    }

    // Handle both Map and plain object formats for Mongoose compatibility
    const getUserModuleVideos = () => {
      const data = userProfile.userModuleVideos;
      console.log(`[VideoService.loadState] Getting user module videos for ${this.moduleKey}:`, {
        dataType: typeof data,
        isMap: data instanceof Map,
        rawData: data,
        moduleKey: this.moduleKey
      });

      if (data instanceof Map) {
        const result = data.get(this.moduleKey) || [];
        console.log(`[VideoService.loadState] Map result for ${this.moduleKey}:`, result);
        return result;
      }
      const result = data?.[this.moduleKey] || [];
      console.log(`[VideoService.loadState] Object result for ${this.moduleKey}:`, result);
      return result;
    };

    const getUserAIVideos = () => {
      const data = userProfile.userAIVideos;
      console.log(`[VideoService.loadState] Getting user AI videos for ${this.moduleKey}:`, {
        dataType: typeof data,
        isMap: data instanceof Map,
        rawData: data
      });

      if (data instanceof Map) {
        const result = data.get(this.moduleKey) || [];
        console.log(`[VideoService.loadState] AI Map result for ${this.moduleKey}:`, result);
        return result;
      }
      const result = data?.[this.moduleKey] || [];
      console.log(`[VideoService.loadState] AI Object result for ${this.moduleKey}:`, result);
      return result;
    };

    const getUserAISearchUsage = () => {
      const data = userProfile.userAISearchUsage;
      if (data instanceof Map) {
        return data.get(this.moduleKey) || 0;
      }
      return data?.[this.moduleKey] || 0;
    };

    const result = {
      userVideos: getUserModuleVideos(),
      aiVideos: getUserAIVideos(),
      aiSearchCount: getUserAISearchUsage()
    };

    console.log(`[VideoService.loadState] Final result for ${this.moduleKey}:`, result);
    return result;
  }
  /**
   * Validate and add a user video
   */
  async addUserVideo(
    params: AddVideoParams, 
    currentState: VideoServiceState
  ): Promise<VideoManagementResult> {
    try {
      console.log('[VideoService] Adding user video:', { 
        url: params.url, 
        isPlaylist: params.isPlaylist,
        moduleKey: this.moduleKey 
      });
      
      // Check limits
      if (currentState.userVideos.length >= this.maxUserVideos) {
        return {
          success: false,
          error: `You can only add up to ${this.maxUserVideos} videos per module`
        };
      }

      // Validate and normalize URL
      const urlResult = normalizeYouTubeUrl(params.url, params.isPlaylist);
      console.log('[VideoService] URL validation result:', urlResult);
      
      if (!urlResult.isValid) {
        return {
          success: false,
          error: urlResult.error || 'Invalid YouTube URL'
        };
      }

      // Check if video already exists
      const existingVideo = currentState.userVideos.find(
        v => v.youtubeEmbedUrl === urlResult.embedUrl
      );
      if (existingVideo) {
        return {
          success: false,
          error: 'This video is already added to the module'
        };
      }

      // Check video availability (more permissive for playlists)
      const isAvailable = await checkYouTubeAvailability(urlResult.embedUrl);
      console.log('[VideoService] Availability check result:', { embedUrl: urlResult.embedUrl, isAvailable });
      
      if (!isAvailable) {
        const errorMsg = urlResult.type === 'playlist' 
          ? 'This playlist may not be available for embedding. This could be due to privacy settings or regional restrictions. You can still try adding it.'
          : 'This video is not available for embedding. It may be private, restricted, or have embedding disabled.';
        
        // For playlists, be more permissive and allow adding even if availability check fails
        if (urlResult.type === 'playlist') {
          console.warn('[VideoService] Playlist availability check failed, but allowing addition');
        } else {
          return {
            success: false,
            error: errorMsg
          };
        }
      }

      // Create video object
      const newVideo: VideoLink = {
        id: generateVideoId(urlResult.embedUrl, 'user'),
        youtubeEmbedUrl: urlResult.embedUrl,
        title: params.title.trim(),
        langCode: params.language.substring(0, 2).toLowerCase(),
        langName: params.language,
        creator: params.creator?.trim() || '',
        isPlaylist: urlResult.type === 'playlist',
        notes: params.notes || 'User added to this module'
      };

      console.log('[VideoService] Created video object:', newVideo);

      return {
        success: true,
        video: newVideo
      };
    } catch (error) {
      console.error('[VideoService] Error adding user video:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add video'
      };
    }
  }

  /**
   * Process and validate AI-found videos
   */
  async processAIVideos(
    aiVideos: VideoLink[], 
    currentState: VideoServiceState
  ): Promise<VideoManagementResult> {
    try {
      // Check AI search limit
      if (currentState.aiSearchCount >= this.maxAISearches) {
        return {
          success: false,
          error: `You've reached the limit of ${this.maxAISearches} AI searches for this module`
        };
      }

      // Get existing video URLs to avoid duplicates
      const existingUrls = new Set([
        ...currentState.userVideos.map(v => v.youtubeEmbedUrl),
        ...currentState.aiVideos.map(v => v.youtubeEmbedUrl)
      ]);      // Validate and filter AI videos
      const validVideos: VideoLink[] = [];
      const rejectedVideos: Array<{url: string, reason: string}> = [];
      
      console.log(`[VideoService] Processing ${aiVideos.length} AI videos for availability check`);
      
      for (const [index, video] of aiVideos.entries()) {
        console.log(`[VideoService] Checking video ${index + 1}/${aiVideos.length}: ${video.youtubeEmbedUrl}`);
        
        // Skip if already exists
        if (existingUrls.has(video.youtubeEmbedUrl)) {
          const reason = 'Already exists in collection';
          console.log(`[VideoService] ${reason}: ${video.youtubeEmbedUrl}`);
          rejectedVideos.push({ url: video.youtubeEmbedUrl, reason });
          continue;
        }

        // Validate URL format
        const urlResult = normalizeYouTubeUrl(video.youtubeEmbedUrl);
        if (!urlResult.isValid) {
          const reason = 'Invalid URL format';
          console.warn(`[VideoService] ${reason}: ${video.youtubeEmbedUrl}`);
          rejectedVideos.push({ url: video.youtubeEmbedUrl, reason });
          continue;
        }        // Check availability - this is the critical step
        console.log(`[VideoService] Checking availability for: ${urlResult.embedUrl}`);
        try {
          // For AI-found educational videos, be more permissive
          const isAvailable = await checkYouTubeAvailability(urlResult.embedUrl);
          if (!isAvailable) {
            const reason = 'Video not available or not embeddable';
            console.warn(`[VideoService] ${reason}: ${video.youtubeEmbedUrl}`);
            // Don't reject immediately - try to add anyway for educational content
            console.log(`[VideoService] Adding video anyway for educational value: ${video.youtubeEmbedUrl}`);
          } else {
            console.log(`[VideoService] ✓ Video is available and embeddable: ${urlResult.embedUrl}`);
          }
        } catch (availabilityError) {
          console.log(`[VideoService] Availability check failed, but adding anyway for educational content: ${video.youtubeEmbedUrl}`, availabilityError);
        }

        // Add with proper ID and validation
        const processedVideo: VideoLink = {
          ...video,
          id: generateVideoId(urlResult.embedUrl, 'ai'),
          youtubeEmbedUrl: urlResult.embedUrl,
          isPlaylist: urlResult.type === 'playlist',
          notes: video.notes || 'Found by AI for this module'
        };        console.log(`[VideoService] ✓ AI video validated and added: ${processedVideo.title} (${processedVideo.id})`);
        validVideos.push(processedVideo);
      }

      // Log detailed results
      console.log(`[VideoService] AI video processing complete:`, {
        total: aiVideos.length,
        valid: validVideos.length,
        rejected: rejectedVideos.length,
        rejectionReasons: rejectedVideos.reduce((acc, curr) => {
          acc[curr.reason] = (acc[curr.reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });      if (validVideos.length === 0) {
        const errorMessage = rejectedVideos.length > 0 
          ? `The AI found ${aiVideos.length} videos but they may have restrictions. ${rejectedVideos.length} were checked: ${rejectedVideos.map(r => r.reason).join(', ')}. Try searching for more specific educational topics or check the videos manually.`
          : 'No valid videos found or all videos already exist in your collection. The AI may need more specific search terms.';
        
        console.log(`[VideoService] ${errorMessage}`);
        return {
          success: false,
          error: errorMessage
        };
      }

      console.log(`[VideoService] Successfully processed ${validVideos.length} valid AI videos out of ${aiVideos.length} candidates`);
      return {
        success: true,
        videos: validVideos
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process AI videos'
      };
    }
  }

  /**
   * Remove a video by ID from the appropriate collection
   */
  removeVideo(
    videoId: string, 
    currentState: VideoServiceState
  ): VideoManagementResult & { updatedState: VideoServiceState } {
    // Try to remove from user videos
    const userVideoIndex = currentState.userVideos.findIndex(v => v.id === videoId);
    if (userVideoIndex !== -1) {
      const newUserVideos = [...currentState.userVideos];
      newUserVideos.splice(userVideoIndex, 1);
      
      return {
        success: true,
        updatedState: {
          ...currentState,
          userVideos: newUserVideos
        }
      };
    }

    // Try to remove from AI videos
    const aiVideoIndex = currentState.aiVideos.findIndex(v => v.id === videoId);
    if (aiVideoIndex !== -1) {
      const newAIVideos = [...currentState.aiVideos];
      newAIVideos.splice(aiVideoIndex, 1);
      
      return {
        success: true,
        updatedState: {
          ...currentState,
          aiVideos: newAIVideos
        }
      };
    }

    return {
      success: false,
      error: 'Video not found',
      updatedState: currentState
    };
  }

  /**
   * Get all videos for a module with proper ordering
   */
  getAllVideos(
    moduleVideoLinks: VideoLink[] = [],
    moduleDefaultUrl?: string,
    currentState?: VideoServiceState
  ): VideoLink[] {
    const videos: VideoLink[] = [];

    // Add module default video if exists
    if (moduleDefaultUrl) {
      const urlResult = normalizeYouTubeUrl(moduleDefaultUrl);
      if (urlResult.isValid) {
        videos.push({
          id: generateVideoId(urlResult.embedUrl, 'module-default'),
          youtubeEmbedUrl: urlResult.embedUrl,
          title: 'Module Default Video',
          langCode: 'en',
          langName: 'English',
          creator: '',
          isPlaylist: urlResult.type === 'playlist',
          notes: 'Default module video'
        });
      }
    }

    // Add module video links
    if (moduleVideoLinks?.length > 0) {
      const validModuleVideos = moduleVideoLinks
        .filter(v => v && v.youtubeEmbedUrl)
        .map(v => ({
          ...v,
          id: v.id || generateVideoId(v.youtubeEmbedUrl, 'module'),
          title: v.title || 'Module Video'
        }));
      videos.push(...validModuleVideos);
    }    // Add user videos
    if (currentState && currentState.userVideos && currentState.userVideos.length > 0) {
      videos.push(...currentState.userVideos);
    }

    // Add AI videos
    if (currentState && currentState.aiVideos && currentState.aiVideos.length > 0) {
      videos.push(...currentState.aiVideos);
    }

    // Remove duplicates based on embed URL
    const uniqueVideos = new Map<string, VideoLink>();
    videos.forEach(video => {
      if (video.youtubeEmbedUrl && !uniqueVideos.has(video.youtubeEmbedUrl)) {
        uniqueVideos.set(video.youtubeEmbedUrl, video);
      }
    });

    return Array.from(uniqueVideos.values());
  }  /**
   * Persist state to user profile (with auth service)
   */
  async persistState(
    newState: VideoServiceState,
    updateUserProfile?: (updates: any) => Promise<void>,
    currentUserProfile?: any
  ): Promise<boolean> {
    console.log('VideoService: Attempting to persist state:', {
      moduleKey: this.moduleKey,
      newState,
      hasUpdateFunction: typeof updateUserProfile === 'function',
      currentUserProfile: currentUserProfile ? {
        userModuleVideos: currentUserProfile.userModuleVideos,
        userAIVideos: currentUserProfile.userAIVideos,
        userAISearchUsage: currentUserProfile.userAISearchUsage
      } : null
    });

    if (!updateUserProfile || typeof updateUserProfile !== 'function') {
      console.warn('Cannot persist video state - auth service not available');
      return false;
    }    try {
      // Merge with existing data to avoid overwriting other modules
      // Convert Maps to plain objects and filter out Mongoose internal properties
      const getPlainObject = (mapOrObject: any) => {
        if (mapOrObject instanceof Map) {
          const entries = Array.from(mapOrObject.entries()).filter(([key]) => !key.startsWith('$'));
          return Object.fromEntries(entries);
        }
        if (mapOrObject && typeof mapOrObject === 'object') {
          const filtered: any = {};
          for (const [key, value] of Object.entries(mapOrObject)) {
            if (!key.startsWith('$') && !key.startsWith('_') && key !== '__v') {
              filtered[key] = value;
            }
          }
          return filtered;
        }
        return mapOrObject || {};
      };

      const currentUserModuleVideos = getPlainObject(currentUserProfile?.userModuleVideos);
      const currentUserAIVideos = getPlainObject(currentUserProfile?.userAIVideos);
      const currentUserAISearchUsage = getPlainObject(currentUserProfile?.userAISearchUsage);

      const updateData = {
        userModuleVideos: {
          ...currentUserModuleVideos,
          [this.moduleKey]: newState.userVideos
        },
        userAIVideos: {
          ...currentUserAIVideos,
          [this.moduleKey]: newState.aiVideos
        },
        userAISearchUsage: {
          ...currentUserAISearchUsage,
          [this.moduleKey]: newState.aiSearchCount
        }
      };

      console.log('VideoService: Persisting update data:', updateData);

      await updateUserProfile(updateData);
      console.log('VideoService: Successfully persisted video state');
      return true;
    } catch (error) {
      console.error('VideoService: Failed to persist video state:', error);
      return false;
    }
  }
}
