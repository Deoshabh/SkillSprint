import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase, User } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] === DEBUGGING USER VIDEO DATA ===');
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('-password');

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('[DEBUG] Raw user data from database:', {
      _id: user._id,
      email: user.email,
      userModuleVideos: user.userModuleVideos,
      userAIVideos: user.userAIVideos,
      userAISearchUsage: user.userAISearchUsage,
      userModuleVideosType: typeof user.userModuleVideos,
      userAIVideosType: typeof user.userAIVideos,
      userModuleVideosConstructor: user.userModuleVideos?.constructor?.name,
      userAIVideosConstructor: user.userAIVideos?.constructor?.name,
      userModuleVideosIsMap: user.userModuleVideos instanceof Map,
      userAIVideosIsMap: user.userAIVideos instanceof Map
    });

    // Try to convert to plain object
    const moduleVideosPlain = user.userModuleVideos ? Object.fromEntries(user.userModuleVideos) : {};
    const aiVideosPlain = user.userAIVideos ? Object.fromEntries(user.userAIVideos) : {};

    console.log('[DEBUG] Converted to plain objects:', {
      moduleVideosPlain,
      aiVideosPlain
    });

    return NextResponse.json({
      success: true,
      rawData: {
        userModuleVideos: user.userModuleVideos,
        userAIVideos: user.userAIVideos,
        userAISearchUsage: user.userAISearchUsage
      },
      typeInfo: {
        userModuleVideosType: typeof user.userModuleVideos,
        userAIVideosType: typeof user.userAIVideos,
        userModuleVideosConstructor: user.userModuleVideos?.constructor?.name,
        userAIVideosConstructor: user.userAIVideos?.constructor?.name,
        userModuleVideosIsMap: user.userModuleVideos instanceof Map,
        userAIVideosIsMap: user.userAIVideos instanceof Map
      },
      plainObjects: {
        moduleVideosPlain,
        aiVideosPlain
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error getting user debug data:', error);
    return NextResponse.json(
      { message: 'Failed to get debug data', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
