import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { VideoService } from '@/lib/video-service';
import { connectToDatabase, User } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    console.log('[Video API GET] === STARTING VIDEO FETCH ===');
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('[Video API GET] No session or email');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    console.log(`[Video API GET] Session found for email: ${session.user.email}`);
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('-password');

    if (!user) {
      console.log('[Video API GET] User not found in database');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { courseId, moduleId } = await params;
    const moduleKey = `${courseId}-${moduleId}`;

    console.log(`[Video API GET] User found: ${user._id}, course: ${courseId}, module: ${moduleId}, moduleKey: ${moduleKey}`);
    console.log(`[Video API GET] Raw user video data:`, {
      userModuleVideos: user.userModuleVideos,
      userAIVideos: user.userAIVideos,
      userAISearchUsage: user.userAISearchUsage,
      userModuleVideosType: typeof user.userModuleVideos,
      userAIVideosType: typeof user.userAIVideos
    });

    // Create video service instance
    const videoService = new VideoService(courseId, moduleId);
    const videoState = videoService.loadState(user);
    
    console.log(`[Video API GET] Video service loaded state:`, {
      userVideos: videoState.userVideos,
      userVideosLength: videoState.userVideos.length,
      aiVideos: videoState.aiVideos,
      aiVideosLength: videoState.aiVideos.length,
      aiSearchCount: videoState.aiSearchCount,
      moduleKey: moduleKey
    });

    const responseData = {
      customVideos: videoState.userVideos,
      aiVideos: videoState.aiVideos,
      aiSearchCount: videoState.aiSearchCount
    };

    console.log(`[Video API GET] Sending response:`, responseData);

    const response = NextResponse.json(responseData);

    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('[Video API GET] Error getting videos:', error);
    return NextResponse.json(
      { message: 'Failed to get videos', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    console.log('[Video API POST] === STARTING VIDEO ADDITION ===');
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('[Video API POST] No session or email');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('-password');

    if (!user) {
      console.log('[Video API POST] User not found in database');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { courseId, moduleId } = await params;
    const body = await request.json();
    const moduleKey = `${courseId}-${moduleId}`;

    console.log(`[Video API POST] Adding custom video for user ${user._id}, course ${courseId}, module ${moduleId}, moduleKey: ${moduleKey}:`, body);
    console.log(`[Video API POST] User data before addition:`, {
      userModuleVideos: user.userModuleVideos,
      userAIVideos: user.userAIVideos,
      userAISearchUsage: user.userAISearchUsage
    });

    if (!body.url) {
      return NextResponse.json({ message: 'Video URL is required' }, { status: 400 });
    }

    // Create video service instance
    const videoService = new VideoService(courseId, moduleId);
    const currentState = videoService.loadState(user);
    
    console.log(`[Video API POST] Current state loaded:`, currentState);

    // Add the video
    const result = await videoService.addUserVideo({
      url: body.url,
      title: body.title || 'Custom Video',
      language: body.language || 'English',
      creator: body.creator || '',
      isPlaylist: body.isPlaylist || false,
      notes: body.notes || 'User added to this module'
    }, currentState);

    console.log(`[Video API POST] Video addition result:`, result);

    if (result.success && result.video) {
      // Update state
      const newState = {
        ...currentState,
        userVideos: [...currentState.userVideos, result.video]
      };

      console.log(`[Video API POST] New state to persist:`, newState);

      // Persist to database
      const updateUserProfile = async (updates: any) => {
        console.log(`[Video API POST] Updating user profile with:`, updates);
        const updatedUser = await User.findOneAndUpdate(
          { email: session.user.email },
          { $set: updates },
          { new: true }
        );
        console.log(`[Video API POST] User updated in database:`, {
          id: updatedUser?._id,
          userModuleVideos: updatedUser?.userModuleVideos,
          userAIVideos: updatedUser?.userAIVideos
        });
      };

      const persisted = await videoService.persistState(newState, updateUserProfile, user);
      
      if (persisted) {
        console.log(`[Video API POST] Successfully added and persisted custom video`);
        
        // Verify the data was actually saved by re-querying the user
        const verifyUser = await User.findOne({ email: session.user.email }).select('-password');
        console.log(`[Video API POST] Verification - user data after save:`, {
          userModuleVideos: verifyUser?.userModuleVideos,
          moduleKey: moduleKey,
          videosForThisModule: verifyUser?.userModuleVideos?.[moduleKey]
        });

        const response = NextResponse.json({
          customVideos: newState.userVideos,
          aiVideos: newState.aiVideos,
          aiSearchCount: newState.aiSearchCount,
          message: 'Video added successfully'
        });

        // Prevent caching to ensure fresh data
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
      } else {
        console.error(`[Video API POST] Failed to persist custom video`);
        return NextResponse.json({ message: 'Failed to save video' }, { status: 500 });
      }
    } else {
      console.error(`[Video API POST] Failed to add custom video:`, result.error);
      return NextResponse.json({ message: result.error || 'Failed to add video' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Video API POST] Error adding video:', error);
    return NextResponse.json(
      { message: 'Failed to add video', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('-password');    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { courseId, moduleId } = await params;
    const body = await request.json();

    console.log(`[Video API] Removing video for user ${user._id}, course ${courseId}, module ${moduleId}:`, body);

    if (!body.url && !body.videoId) {
      return NextResponse.json({ message: 'Video URL or video ID is required' }, { status: 400 });
    }

    // Create video service instance
    const videoService = new VideoService(courseId, moduleId);
    const currentState = videoService.loadState(user);
    
    // Find video to remove (by URL or ID)
    let videoToRemove = null;
    if (body.videoId) {
      videoToRemove = [...currentState.userVideos, ...currentState.aiVideos]
        .find(v => v.id === body.videoId);
    } else if (body.url) {
      const normalizedUrl = body.url.includes('embed') ? body.url : body.url.replace('watch?v=', 'embed/');
      videoToRemove = [...currentState.userVideos, ...currentState.aiVideos]
        .find(v => v.youtubeEmbedUrl === normalizedUrl);
    }    if (!videoToRemove || !videoToRemove.id) {
      return NextResponse.json({ message: 'Video not found' }, { status: 404 });
    }

    // Remove the video
    const result = videoService.removeVideo(videoToRemove.id, currentState);

    if (result.success) {
      // Persist to database
      const updateUserProfile = async (updates: any) => {
        await User.findOneAndUpdate(
          { email: session.user.email },
          { $set: updates },
          { new: true }
        );
      };

      const persisted = await videoService.persistState(result.updatedState, updateUserProfile, user);
      
      if (persisted) {
        console.log(`[Video API] Successfully removed and persisted video deletion`);
        return NextResponse.json({
          customVideos: result.updatedState.userVideos,
          aiVideos: result.updatedState.aiVideos,
          aiSearchCount: result.updatedState.aiSearchCount,
          message: 'Video removed successfully'
        });
      } else {
        console.error(`[Video API] Failed to persist video removal`);
        return NextResponse.json({ message: 'Failed to save changes' }, { status: 500 });
      }
    } else {
      console.error(`[Video API] Failed to remove video:`, result.error);
      return NextResponse.json({ message: result.error || 'Failed to remove video' }, { status: 500 });
    }
  } catch (error) {
    console.error('[Video API] Error removing video:', error);
    return NextResponse.json(
      { message: 'Failed to remove video', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
