import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { MessagingService } from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetSegment, targetFilters } = await request.json();
    
    const userCount = await MessagingService.getTargetUserCount({
      targetSegment,
      targetFilters
    });
    
    return NextResponse.json({ count: userCount });
  } catch (error) {
    console.error('Error getting target user count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
