import { NextRequest } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { 
  withApiHandler, 
  createApiResponse, 
  withDatabase,
  RequestContext 
} from '@/lib/api-utils';
import { z } from 'zod';

// Progress update schema
const progressUpdateSchema = z.object({
  completedModules: z.record(z.array(z.string())).optional(),
  userModuleVideos: z.record(z.array(z.any())).optional(),
  userAIVideos: z.record(z.array(z.any())).optional(),
  userAISearchUsage: z.record(z.number()).optional(),
  points: z.number().min(0).optional(),
  earnedBadges: z.array(z.string()).optional(),
  enrolledCourses: z.array(z.string()).optional(),
  dailyPlans: z.record(z.any()).optional(),
});

// Helper function to convert Map fields to plain objects
const convertMapToObject = (mapField: any) => {
  if (!mapField) return {};
  try {
    if (mapField instanceof Map) {
      return Object.fromEntries(mapField);
    }
    // If it's already an object, return as-is
    if (typeof mapField === 'object') {
      return mapField;
    }
    return {};
  } catch (error) {
    console.error('Error converting map field:', error);
    return {};
  }
};

export const GET = withApiHandler(
  async (context: RequestContext) => {
    const { user } = context;

    const userRecord = await withDatabase(
      async () => {
        await connectToDatabase();
        return await User.findOne({ email: user.email }).select('-password');
      },
      'Failed to fetch user progress from database'
    );

    if (!userRecord) {
      return createApiResponse(null, 'User not found', { requestId: context.requestId });
    }

    // Debug logging for Map structures
    console.log('[GET /api/user/progress] Raw user data from MongoDB:', {
      userModuleVideos: {
        type: typeof userRecord.userModuleVideos,
        isMap: userRecord.userModuleVideos instanceof Map,
        size: userRecord.userModuleVideos?.size,
        keys: userRecord.userModuleVideos instanceof Map ? Array.from(userRecord.userModuleVideos.keys()) : 'not a map',
        rawValue: userRecord.userModuleVideos
      },
      userAIVideos: {
        type: typeof userRecord.userAIVideos,
        isMap: userRecord.userAIVideos instanceof Map,
        size: userRecord.userAIVideos?.size,
        keys: userRecord.userAIVideos instanceof Map ? Array.from(userRecord.userAIVideos.keys()) : 'not a map',
        rawValue: userRecord.userAIVideos
      },
      userAISearchUsage: {
        type: typeof userRecord.userAISearchUsage,
        isMap: userRecord.userAISearchUsage instanceof Map,
        size: userRecord.userAISearchUsage?.size,
        keys: userRecord.userAISearchUsage instanceof Map ? Array.from(userRecord.userAISearchUsage.keys()) : 'not a map',
        rawValue: userRecord.userAISearchUsage
      }
    });

    // Calculate progress based on user data
    const userProgress = {
      completedModules: userRecord.completedModules || {},
      userModuleVideos: convertMapToObject(userRecord.userModuleVideos),
      userAIVideos: convertMapToObject(userRecord.userAIVideos),
      userAISearchUsage: convertMapToObject(userRecord.userAISearchUsage),
      points: userRecord.points || 0,
      earnedBadges: userRecord.earnedBadges || [],
      enrolledCourses: userRecord.enrolledCourses || [],
      dailyPlans: userRecord.dailyPlans || {},
      // Enhanced statistics
      stats: {
        totalModulesCompleted: Object.values(userRecord.completedModules || {}).flat().length,
        totalCoursesEnrolled: (userRecord.enrolledCourses || []).length,
        totalPointsEarned: userRecord.points || 0,
        totalBadgesEarned: (userRecord.earnedBadges || []).length,
        totalVideosAdded: Object.values(convertMapToObject(userRecord.userModuleVideos)).flat().length,
        totalAIVideosFound: Object.values(convertMapToObject(userRecord.userAIVideos)).flat().length,
        lastActivity: userRecord.updatedAt || new Date(),
        joinedDate: userRecord.createdAt || new Date()
      }
    };

    console.log('[GET /api/user/progress] Converted user progress:', {
      userModuleVideos: userProgress.userModuleVideos,
      userAIVideos: userProgress.userAIVideos,
      userAISearchUsage: userProgress.userAISearchUsage,
      enrolledCourses: userProgress.enrolledCourses
    });    return createApiResponse(
      userProgress, 
      'Progress retrieved successfully',
      { requestId: context.requestId },
      true // Prevent caching
    );
  },
  { requireAuth: true }
);

export const PUT = withApiHandler(
  async (context: RequestContext) => {
    const { user, body } = context;

    console.log('[PUT /api/user/progress] Received update data:', JSON.stringify(body, null, 2));
    console.log('[PUT /api/user/progress] Data types in request:', {
      userModuleVideos: {
        type: typeof body.userModuleVideos,
        keys: body.userModuleVideos ? Object.keys(body.userModuleVideos) : 'null',
        value: body.userModuleVideos
      },
      userAIVideos: {
        type: typeof body.userAIVideos,
        keys: body.userAIVideos ? Object.keys(body.userAIVideos) : 'null',
        value: body.userAIVideos
      },
      userAISearchUsage: {
        type: typeof body.userAISearchUsage,
        keys: body.userAISearchUsage ? Object.keys(body.userAISearchUsage) : 'null',
        value: body.userAISearchUsage
      }
    });

    const updatedUser = await withDatabase(
      async () => {
        await connectToDatabase();
        
        // Get the current user to see existing data
        const currentUser = await User.findOne({ email: user.email }).select('-password');
        console.log('[PUT /api/user/progress] Current user data before update:', {
          userModuleVideos: currentUser?.userModuleVideos ? Object.fromEntries(currentUser.userModuleVideos) : {},
          userAIVideos: currentUser?.userAIVideos ? Object.fromEntries(currentUser.userAIVideos) : {},
          userAISearchUsage: currentUser?.userAISearchUsage ? Object.fromEntries(currentUser.userAISearchUsage) : {}
        });

        // Update user progress
        const result = await User.findOneAndUpdate(
          { email: user.email },
          { $set: body },
          { new: true, select: '-password' }
        );

        if (!result) {
          throw new Error('User not found');
        }

        console.log('[PUT /api/user/progress] User after MongoDB update - raw data:', {
          userModuleVideos: {
            type: typeof result.userModuleVideos,
            isMap: result.userModuleVideos instanceof Map,
            keys: result.userModuleVideos instanceof Map ? Array.from(result.userModuleVideos.keys()) : 'not a map',
            rawValue: result.userModuleVideos
          },
          userAIVideos: {
            type: typeof result.userAIVideos,
            isMap: result.userAIVideos instanceof Map,
            rawValue: result.userAIVideos
          },
          userAISearchUsage: {
            type: typeof result.userAISearchUsage,
            isMap: result.userAISearchUsage instanceof Map,
            rawValue: result.userAISearchUsage
          }
        });

        return result;
      },
      'Failed to update user progress'
    );

    const responseData = {
      ...updatedUser.toObject(),
      userModuleVideos: convertMapToObject(updatedUser.userModuleVideos),
      userAIVideos: convertMapToObject(updatedUser.userAIVideos),
      userAISearchUsage: convertMapToObject(updatedUser.userAISearchUsage),
    };

    return createApiResponse(
      responseData,
      'Progress updated successfully',
      { requestId: context.requestId }
    );
  },
  { 
    requireAuth: true,
    validateSchema: progressUpdateSchema 
  }
);
