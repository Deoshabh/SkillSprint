import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DailyPlansService, DatabaseHelpers } from '@/lib/data-service';

// Updated to return empty array instead of 404 when user not found
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert Clerk ID to MongoDB User ID
    const mongoUserId = await DatabaseHelpers.getMongoUserIdFromClerkId(userId);
    if (!mongoUserId) {
      // Return empty array if user doesn't exist in database yet
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const plans = await DailyPlansService.getUserDailyPlans(mongoUserId);
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching daily plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert Clerk ID to MongoDB User ID
    const mongoUserId = await DatabaseHelpers.getMongoUserIdFromClerkId(userId);
    if (!mongoUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const plan = await DailyPlansService.createDailyPlan(mongoUserId, data);
    
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating daily plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
