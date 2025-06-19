import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { VideoService } from '@/lib/video-service';
import { connectToDatabase, User } from '@/lib/mongodb';

// Temporary fallback function for AI video search
const findYoutubeVideosForModule = async (input: {
  moduleTitle: string;
  moduleDescription: string;
  preferredLanguage: string;
}) => {
  // Return mock data for now until OpenTelemetry issues are resolved
  console.log('[AI Video Search] Using fallback mock data due to OpenTelemetry issues');
  return {
    videos: [
      {
        youtubeEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: `Sample Video for: ${input.moduleTitle}`,
        langCode: 'en',
        langName: 'English',
        creator: 'Educational Content',
        isPlaylist: false
      }
    ]
  };
};

// import { findYoutubeVideosForModule, type FindYoutubeVideosInput } from '@/ai/flows/find-youtube-videos-flow';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('-password');

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { courseId, moduleId } = await params;
    const body = await request.json();

    console.log(`[AI Video Search] Searching videos for user ${user._id}, course ${courseId}, module ${moduleId}:`, body);

    if (!body.query) {
      return NextResponse.json({ message: 'Search query is required' }, { status: 400 });
    }

    // Create video service instance
    const videoService = new VideoService(courseId, moduleId);
    const currentState = videoService.loadState(user);
    
    // Check AI search limit
    if (currentState.aiSearchCount >= 2) {
      return NextResponse.json({ 
        message: 'You have reached the limit of 2 AI searches for this module' 
      }, { status: 429 });
    }

    try {      // Call AI flow to find videos
      const aiResponse = await findYoutubeVideosForModule({
        moduleTitle: body.query,
        moduleDescription: `Finding videos for: ${body.query}`,
        preferredLanguage: body.language || 'English'
      });

      console.log(`[AI Video Search] AI response:`, aiResponse);

      if (!aiResponse.videos || aiResponse.videos.length === 0) {
        return NextResponse.json({ 
          message: 'No videos found for your search query',
          videos: []
        });
      }

      // Convert AI response to VideoLink format for video service
      const videoLinksForService = aiResponse.videos.map(video => ({
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        youtubeEmbedUrl: video.youtubeEmbedUrl,
        title: video.title,
        langCode: video.langCode,
        langName: video.langName,
        creator: video.creator || 'Unknown Creator',
        isPlaylist: video.isPlaylist || false,
        notes: `Found by AI search for: ${body.query}`
      }));      // Process AI videos through video service
      const result = await videoService.processAIVideos(videoLinksForService, currentState);

      if (result.success && result.videos && result.videos.length > 0) {
        // Update state with new AI videos and incremented search count
        const newState = {
          ...currentState,
          aiVideos: [...currentState.aiVideos, ...result.videos],
          aiSearchCount: currentState.aiSearchCount + 1
        };        // Persist to database
        const updateUserProfile = async (updates: any) => {
          // Convert Mongoose Maps to plain objects to avoid persistence errors
          const cleanUpdates = {
            userModuleVideos: updates.userModuleVideos instanceof Map 
              ? Object.fromEntries(updates.userModuleVideos) 
              : updates.userModuleVideos,
            userAIVideos: updates.userAIVideos instanceof Map 
              ? Object.fromEntries(updates.userAIVideos) 
              : updates.userAIVideos,
            userAISearchUsage: updates.userAISearchUsage instanceof Map 
              ? Object.fromEntries(updates.userAISearchUsage) 
              : updates.userAISearchUsage
          };

          await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: cleanUpdates },
            { new: true }
          );
        };

        const persisted = await videoService.persistState(newState, updateUserProfile, user);
          if (persisted) {
          console.log(`[AI Video Search] Successfully found and persisted ${result.videos.length} valid videos`);
          const response = NextResponse.json({
            videos: result.videos,
            customVideos: newState.userVideos,
            aiVideos: newState.aiVideos,
            aiSearchCount: newState.aiSearchCount,
            message: `Found ${result.videos.length} videos`
          });

          // Prevent caching to ensure fresh data
          response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          response.headers.set('Pragma', 'no-cache');
          response.headers.set('Expires', '0');

          return response;
        } else {
          console.error(`[AI Video Search] Failed to persist AI videos`);
          return NextResponse.json({ 
            videos: result.videos,
            message: 'Videos found but failed to save. They will be lost on refresh.',
            warning: 'Please try logging out and back in, or contact support if this persists.'
          }, { status: 206 }); // Partial content
        }
      } else {
        const errorMessage = result.error || 'No valid embeddable videos found';
        console.log(`[AI Video Search] No valid videos found: ${errorMessage}`);
        return NextResponse.json({ 
          message: errorMessage.includes('availability') || errorMessage.includes('embeddable') 
            ? 'No embeddable videos found. The AI found videos but they are not available for embedding or may be restricted.'
            : errorMessage,
          videos: [],
          suggestion: 'Try searching with different keywords or check if the topic has publicly available educational content on YouTube.'
        });
      }
    } catch (aiError) {
      console.error('[AI Video Search] AI flow error:', aiError);
      return NextResponse.json({
        message: 'AI video search service temporarily unavailable',
        error: aiError instanceof Error ? aiError.message : 'Unknown AI error'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('[AI Video Search] Error searching videos:', error);
    return NextResponse.json(
      { message: 'Failed to search videos', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
