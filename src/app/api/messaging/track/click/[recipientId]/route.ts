import { NextRequest, NextResponse } from 'next/server';
import { MessagingService } from '@/lib/data-service';

interface RouteParams {
  params: Promise<{ recipientId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { recipientId } = await params;
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('url');
    
    // Track the email click
    await MessagingService.trackEmailClick(recipientId);
    
    // Redirect to the original URL
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    } else {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error tracking email click:', error);
    
    // Still redirect if possible
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('url');
    
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    } else {
      return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
    }
  }
}
