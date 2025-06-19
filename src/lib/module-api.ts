// API functions for module page functionality
import type { Course as CourseType, Module as ModuleType, VideoLink, CourseDocument } from '@/lib/types';

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  youtubeEmbedUrl?: string;
  duration?: string;
  thumbnail?: string;
  source: 'module' | 'ai' | 'custom' | 'playlist-item';
  creator?: string;
  language?: string;
  notes?: string;
  addedAt?: string;
  playlistId?: string;
  videoId?: string;
}

import type { Course as BaseCourse, Module as BaseModule } from './types';

export interface VideoState {
  customVideos: VideoItem[];
  aiVideos: VideoItem[];
  aiSearchCount: number;
}

// Re-export the Course and Module types from the main types file
export type Course = BaseCourse;
export type Module = BaseModule;

/**
 * Document state interface for module documents
 */
export interface DocumentState {
  customDocuments: CourseDocument[];
  aiDocuments: CourseDocument[];
  aiSearchCount: number;
}

/**
 * Fetch document state for a module
 */
export const fetchDocumentState = async (courseId: string, moduleId: string): Promise<DocumentState> => {
  try {
    const response = await fetch(`/api/documents/${courseId}/${moduleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        customDocuments: [],
        aiDocuments: [],
        aiSearchCount: 0
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching document state:', error);
    return {
      customDocuments: [],
      aiDocuments: [],
      aiSearchCount: 0
    };
  }
}

/**
 * Add a custom document to a module
 */
export const addCustomDocument = async (courseId: string, moduleId: string, documentData: any): Promise<DocumentState> => {
  try {
    const response = await fetch(`/api/documents/add-custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...documentData,
        courseId,
        moduleId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error adding custom document:', error);
    throw new Error(error.message || 'Failed to add document');
  }
}

/**
 * Search for AI documents for a module
 */
export const searchAIDocuments = async (courseId: string, moduleId: string, query: string): Promise<DocumentState> => {
  try {
    const response = await fetch(`/api/documents/ai-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        courseId,
        moduleId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search documents: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error searching AI documents:', error);
    throw new Error(error.message || 'Failed to search documents');
  }
}

/**
 * Remove a document from a module
 */
export const removeDocument = async (courseId: string, moduleId: string, documentId: string): Promise<DocumentState> => {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        moduleId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error removing document:', error);
    throw new Error(error.message || 'Failed to remove document');
  }
}

// API functions to fetch real course and module data
export const fetchCourseData = async (courseId: string): Promise<Course | null> => {
  try {
    const response = await fetch(`/api/courses/${courseId}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.course;
  } catch (error) {
    console.error('Failed to fetch course data:', error);
    return null;
  }
};

export const fetchVideoState = async (courseId: string, moduleId: string): Promise<VideoState> => {
  try {
    const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 401) {
      // User not authenticated - return empty state but don't throw
      console.log('User not authenticated, returning empty video state');
      return { customVideos: [], aiVideos: [], aiSearchCount: 0 };
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return {
      customVideos: data.customVideos || data.userVideos || [],
      aiVideos: data.aiVideos || [],
      aiSearchCount: data.aiSearchCount || 0
    };
  } catch (error) {
    console.error('Failed to fetch video state:', error);
    return { customVideos: [], aiVideos: [], aiSearchCount: 0 };
  }
};

export const addCustomVideo = async (courseId: string, moduleId: string, video: {
  url: string;
  title?: string;
  language?: string;
  creator?: string;
  notes?: string;
}): Promise<VideoState> => {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add video');
  }
  
  const data = await response.json();
  return {
    customVideos: data.customVideos || data.userVideos || [],
    aiVideos: data.aiVideos || [],
    aiSearchCount: data.aiSearchCount || 0
  };
};

export const searchAIVideos = async (courseId: string, moduleId: string, query: string): Promise<VideoState> => {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos/search`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, maxResults: 3 })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search videos');
  }
  
  const data = await response.json();
  return {
    customVideos: data.customVideos || data.userVideos || [],
    aiVideos: data.aiVideos || [],
    aiSearchCount: data.aiSearchCount || 0
  };
};

export const removeVideo = async (courseId: string, moduleId: string, videoId: string): Promise<VideoState> => {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove video');
  }
  
  const data = await response.json();
  return {
    customVideos: data.customVideos || data.userVideos || [],
    aiVideos: data.aiVideos || [],
    aiSearchCount: data.aiSearchCount || 0
  };
};

export const renameVideo = async (courseId: string, moduleId: string, videoId: string, newTitle: string): Promise<VideoState> => {
  const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/videos/rename`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, title: newTitle })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to rename video');
  }
  
  const data = await response.json();
  return {
    customVideos: data.customVideos || data.userVideos || [],
    aiVideos: data.aiVideos || [],
    aiSearchCount: data.aiSearchCount || 0
  };
};
