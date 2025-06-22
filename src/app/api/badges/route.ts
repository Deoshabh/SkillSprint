import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAllBadges } from '@/lib/data-service';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badges = await getAllBadges();
    
    return NextResponse.json({ 
      badges,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
