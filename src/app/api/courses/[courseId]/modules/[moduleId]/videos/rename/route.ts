import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { VideoService } from '@/lib/video-service';
import { connectToDatabase, User } from '@/lib/mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  try {
    console.log('[Video Rename API] === STARTING VIDEO RENAME ===');
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('[Video Rename API] No session or email');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    console.log(`[Video Rename API] Session found for email: ${session.user.email}`);
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('-password');

    if (!user) {
      console.log('[Video Rename API] User not found in database');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { courseId, moduleId } = await params;
    const body = await request.json();

    console.log(`[Video Rename API] Renaming video for user ${user._id}, course ${courseId}, module ${moduleId}:`, body);

    if (!body.videoId || !body.title) {
      return NextResponse.json({ message: 'Video ID and title are required' }, { status: 400 });
    }

    if (!body.title.trim()) {
      return NextResponse.json({ message: 'Title cannot be empty' }, { status: 400 });
    }

    // Create video service instance
    const videoService = new VideoService(courseId, moduleId);
    const currentState = videoService.loadState(user);
    
    console.log(`[Video Rename API] Current state loaded:`, currentState);

    // Find video to rename (in either custom or AI videos)
    const videoInCustom = currentState.userVideos.find(v => v.id === body.videoId);
    const videoInAI = currentState.aiVideos.find(v => v.id === body.videoId);
    const videoToRename = videoInCustom || videoInAI;

    if (!videoToRename) {
      console.log(`[Video Rename API] Video not found with ID: ${body.videoId}`);
      return NextResponse.json({ message: 'Video not found' }, { status: 404 });
    }

    console.log(`[Video Rename API] Found video to rename:`, videoToRename);

    // Update the video title
    const updatedState = {
      ...currentState,
      userVideos: currentState.userVideos.map(v => 
        v.id === body.videoId ? { ...v, title: body.title.trim() } : v
      ),
      aiVideos: currentState.aiVideos.map(v => 
        v.id === body.videoId ? { ...v, title: body.title.trim() } : v
      )
    };

    console.log(`[Video Rename API] Updated state:`, updatedState);

    // Persist to database
    const updateUserProfile = async (updates: any) => {
      console.log(`[Video Rename API] Updating user profile with:`, updates);
      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: updates },
        { new: true }
      );
      console.log(`[Video Rename API] User updated in database`);
      return updatedUser;
    };

    const persisted = await videoService.persistState(updatedState, updateUserProfile, user);
    
    if (persisted) {
      console.log(`[Video Rename API] Successfully renamed and persisted video`);
      return NextResponse.json({
        customVideos: updatedState.userVideos,
        aiVideos: updatedState.aiVideos,
        aiSearchCount: updatedState.aiSearchCount,
        message: 'Video renamed successfully'
      });
    } else {
      console.error(`[Video Rename API] Failed to persist video rename`);
      return NextResponse.json({ message: 'Failed to save changes' }, { status: 500 });
    }

  } catch (error) {
    console.error('[Video Rename API] Error renaming video:', error);
    return NextResponse.json(
      { message: 'Failed to rename video', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
