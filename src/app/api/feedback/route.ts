import { NextRequest } from 'next/server';

import { connectToDatabase, Feedback } from '@/lib/mongodb';
import { 
  withApiHandler, 
  createApiResponse, 
  createPaginatedResponse,
  commonSchemas, 
  withDatabase,
  RequestContext 
} from '@/lib/api-utils';
import { auditLog } from '@/lib/auth-utils';
import { z } from 'zod';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

// Enhanced feedback schema
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'course', 'ui', 'performance']),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  courseId: z.string().optional(),
  userName: z.string().optional(),
});

export const GET = withApiHandler(
  async (context: RequestContext) => {
    const { user, query } = context;
    
    // Parse pagination parameters
    const page = parseInt(query?.page || '1');
    const limit = Math.min(parseInt(query?.limit || '20'), 100);

    const { feedback, total } = await withDatabase(
      async () => {
        await connectToDatabase();
        
        let dbQuery: any = {};
        
        // If not admin, only show user's own feedback
        if (user.role !== 'admin') {
          dbQuery.userId = user.id;
        }
        
        // Get paginated results
        const skip = (page - 1) * limit;
        
        const [feedbackList, totalCount] = await Promise.all([
          Feedback.find(dbQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
          Feedback.countDocuments(dbQuery),
        ]);
        
        return { feedback: feedbackList, total: totalCount };
      },
      'Failed to fetch feedback from database'
    );

    return createPaginatedResponse(
      feedback,
      { page, limit, total },
      'Feedback retrieved successfully'
    );
  },
  { requireAuth: true }
);

export const POST = withApiHandler(
  async (context: RequestContext) => {
    const { user, body, request } = context;

    // Enrich feedback with user context
    const feedbackData = {
      ...body,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: body.userName || user.name || 'Anonymous',
      userEmail: user.email,
      status: 'new' as const,
      adminNotes: '',
      submittedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    };

    const newFeedback = await withDatabase(
      async () => {
        await connectToDatabase();
        const feedback = new Feedback(feedbackData);
        await feedback.save();
        return feedback;
      },
      'Failed to submit feedback'
    );

    // Log feedback submission for admin monitoring
    if (typeof auditLog === 'function') {
      try {
        await auditLog(await connectToDatabase().then(({ db }) => db), {
          userId: user.id,
          action: 'feedback_submitted',
          details: {
            feedbackId: newFeedback.id,
            type: body.type,
            priority: body.priority,
          },
          ipAddress: feedbackData.ipAddress,
          userAgent: request.headers.get('user-agent') || 'unknown',
        });
      } catch (auditError) {
        console.error('Failed to log feedback submission:', auditError);
      }
    }

    return createApiResponse(
      newFeedback,
      'Feedback submitted successfully. Thank you for your input!',
      { requestId: context.requestId }
    );
  },
  { 
    requireAuth: true,
    validateSchema: feedbackSchema 
  }
);
